import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { BlogService } from '../../_services/blog-service';
import { CategoryService } from '../../_services/category-service';
import { BlogDto } from '../../_models/blog';
import { CategoryDto } from '../../_models/category';
import { ApiError } from '../../_models/result';
import { SweetAlert } from '../../_services/sweet-alert';   // YENİ


declare const alertify: any;

// Resim alanlarının adları = backend'deki IFormFile property adları.
// (TypeScript'te "type" ile sadece bu üç yazıya izin veren bir tip tanımlıyoruz;
//  C#'taki enum'a benziyor, yanlış yazarsan editör kızarır.)
type ImageField = 'CoverImage' | 'BlogImage1' | 'BlogImage2';

// =====================================================================
// BLOG FORMU: Yeni Blog Yaz + Düzenle (TEK component, iki iş)
// Ortak sayfa: hem admin hem yazar panelinde kullanılıyor.
//   /admin/new-blog            /writer/new-blog            → yeni blog
//   /admin/my-blogs/edit/:id   /writer/my-blogs/edit/:id   → düzenleme
// Rotada :id varsa düzenleme modu, yoksa yeni blog modu.
// Yazarı formdan göndermiyoruz: backend ICurrentUserService ile token'dan alıyor.
// =====================================================================
@Component({
  selector: 'app-blog-form',
  standalone: false,
  templateUrl: './blog-form.html',
  styleUrl: './blog-form.css'
})
export class BlogForm implements OnInit, OnDestroy {

    constructor(private blogService: BlogService,
              private categoryService: CategoryService,
              private swal: SweetAlert,                // YENİ: onay penceresi + bildirim
              private route: ActivatedRoute,
              private router: Router) {}

  // ---------------------------------------------------------------
  // VERİLER
  // ---------------------------------------------------------------

  // Düzenlenen blogun Id'si; yeni blogda null
  blogId: string | null = null;

  // Formun verisi → HTML'de [(ngModel)]="model.mainTitle" vb.
  // categoryId = '' → açılır listede "Kategori seç" seçili gelsin ve required yakalasın
  model: BlogDto = Object.assign(new BlogDto(), { categoryId: '' });

  categories: CategoryDto[] = [];

  // Seçilen dosyalar (henüz seçilmediyse null)
  // Record<ImageField, File | null> → C#: Dictionary<ImageField, File?>
  files: Record<ImageField, File | null> = { CoverImage: null, BlogImage1: null, BlogImage2: null };

  // Ekranda gösterilen önizleme adresi:
  //   yeni dosya seçildiyse → tarayıcının geçici "blob:..." adresi
  //   düzenlemede dosya seçilmediyse → blogun Azure'daki mevcut resmi
  previews: Record<ImageField, string> = { CoverImage: '', BlogImage1: '', BlogImage2: '' };

  // Düzenlemede blogun MEVCUT resimleri ("Seçimi kaldır" deyince bunlara geri dönülüyor)
  private originalImages: Record<ImageField, string> = { CoverImage: '', BlogImage1: '', BlogImage2: '' };

  // Dosya seçerken tarayıcıda yakaladığımız hatalar (boyut, uzantı)
  fileErrors: Record<ImageField, string> = { CoverImage: '', BlogImage1: '', BlogImage2: '' };

  // API'nin döndüğü hatalar: [{ propertyName: "MainTitle", errorMessage: "..." }]
  errors: ApiError[] = [];

  isLoading = false;      // düzenlemede blog yükleniyor
  isSaving = false;       // kaydet'e basıldı, cevap bekleniyor (Kaydet butonu kilitli)
  loadError = '';         // düzenlenecek blog getirilemedi
  submitted = false;      // en az bir kez Kaydet'e basıldı mı? (resim zorunluluk uyarısı için)

  // Backend'deki ImageRules ile aynı kurallar (kullanıcı boşuna yüklemeyi beklemesin diye önden kontrol)
  readonly maxFileSize = 5 * 1024 * 1024;   // 5 MB
  readonly allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  readonly acceptAttr = this.allowedExtensions.join(',');   // <input accept="..."> için

  // Düzenleme modunda mıyız? (HTML'de başlık, buton yazısı vb. buna göre değişiyor)
  get isEditMode(): boolean {
    return !!this.blogId;
  }

  // ---------------------------------------------------------------
  // SAYFA AÇILINCA
  // ---------------------------------------------------------------
  ngOnInit(): void {
    // snapshot.paramMap: adresteki parametreler. /my-blogs/edit/abc-123 → get('id') = "abc-123"
    // /new-blog rotasında :id olmadığı için null döner.
    this.blogId = this.route.snapshot.paramMap.get('id');

    this.loadCategories();

    if (this.isEditMode) {
      this.loadBlog();
    }
  }

  loadCategories() {
    this.categoryService.getCategories().subscribe({
      next: result => this.categories = result.data ?? [],
      error: () => alertify.error("Kategoriler yüklenemedi.")
    });
  }

  // Düzenleme: blogu çekip formu doldur
  loadBlog() {
    this.isLoading = true;
    this.loadError = '';

    this.blogService.getById(this.blogId).subscribe({
      next: result => {
        // Gelen veriyi formun modeline koyuyoruz; inputlar ngModel sayesinde kendiliğinden dolar
        this.model = result.data;

        this.originalImages = {
          CoverImage: result.data.coverImage,
          BlogImage1: result.data.blogImage1,
          BlogImage2: result.data.blogImage2
        };
        // { ...x } → kopyası (ikisi aynı nesne olmasın; birini değiştirince öteki bozulmasın)
        this.previews = { ...this.originalImages };

        this.isLoading = false;
      },
      error: err => {
        this.isLoading = false;
        this.loadError = err.status === 404
          ? "Düzenlemek istediğin blog bulunamadı. Silinmiş olabilir."
          : err.error?.errors?.[0]?.errorMessage ?? "Blog yüklenemedi.";
      }
    });
  }

  // ---------------------------------------------------------------
  // RESİM SEÇME
  // ---------------------------------------------------------------

  // <input type="file" (change)="onFileSelected($event, 'CoverImage', fileInput)">
  // Not: Dosya inputlarında ngModel çalışmaz; seçilen dosyayı (change) olayından kendimiz alıyoruz.
  onFileSelected(event: Event, field: ImageField, input: HTMLInputElement) {
    this.fileErrors[field] = '';

    // event.target: olayın gerçekleştiği input. files[0]: seçilen ilk (tek) dosya
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;   // pencere açılıp "İptal" denirse

    // Uzantı kontrolü: "Foto.JPG" → ".jpg"
    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!this.allowedExtensions.includes(extension)) {
      this.fileErrors[field] = `Sadece ${this.allowedExtensions.join(', ')} dosyaları yüklenebilir.`;
      input.value = '';   // hatalı dosyayı inputtan temizle
      return;
    }

    // Boyut kontrolü (file.size bayt cinsinden)
    if (file.size > this.maxFileSize) {
      this.fileErrors[field] = "Dosya boyutu en fazla 5 MB olabilir.";
      input.value = '';
      return;
    }

    this.revokePreview(field);   // önceki geçici önizleme adresini bırak

    this.files[field] = file;
    // createObjectURL: dosyayı yüklemeden tarayıcıda göstermek için geçici bir adres üretir
    this.previews[field] = URL.createObjectURL(file);

    // Bu alan için API'den kalmış eski hata varsa sil (kullanıcı düzeltti)
    this.errors = this.errors.filter(e => !this.isErrorOf(e, field));
  }

  // "Seçimi kaldır": yeni blogda alan boşalır, düzenlemede mevcut resme geri döner
  removeFile(field: ImageField, input: HTMLInputElement) {
    this.revokePreview(field);
    this.files[field] = null;
    this.previews[field] = this.originalImages[field];
    this.fileErrors[field] = '';
    input.value = '';
  }

  // Geçici blob: adresini serbest bırak (yoksa sayfa açık kaldıkça bellekte durur)
  private revokePreview(field: ImageField) {
    if (this.previews[field]?.startsWith('blob:')) {
      URL.revokeObjectURL(this.previews[field]);
    }
  }

  // Resim zorunluluğu: yeni blogda üçü de şart, düzenlemede hiçbiri şart değil
  isImageMissing(field: ImageField): boolean {
    return !this.isEditMode && !this.files[field];
  }

  get imagesValid(): boolean {
    return !this.isImageMissing('CoverImage')
        && !this.isImageMissing('BlogImage1')
        && !this.isImageMissing('BlogImage2');
  }

  // ---------------------------------------------------------------
  // API HATALARI
  // ---------------------------------------------------------------

  // Bir alanın API hatası: getError('MainTitle') → "Ana başlık boş olamaz."
  // Resimlerde backend "CoverImage.Length" gibi alt adlar da döndürebiliyor; onları da yakalıyoruz.
  // (LINQ: errors.FirstOrDefault(e => ...)?.ErrorMessage)
  getError(field: string): string | undefined {
    return this.errors.find(e => this.isErrorOf(e, field))?.errorMessage;
  }

  private isErrorOf(error: ApiError, field: string): boolean {
    return error.propertyName === field || error.propertyName?.startsWith(field + '.');
  }

  // Bir alana bağlı OLMAYAN hatalar (örn. "Seçilen kategori bulunamadı.") → formun üstünde gösterilir
  get generalErrors(): ApiError[] {
    return this.errors.filter(e => !e.propertyName);
  }

  // ---------------------------------------------------------------
  // KAYDET
  // ---------------------------------------------------------------
    // DEĞİŞTİ: async oldu (SweetAlert onayını await ile bekliyoruz)
  async save(form: NgForm) {
    this.submitted = true;

    // Formda eksik varsa API'ye hiç gitme; bütün alanları "dokunulmuş" say ki kırmızılar görünsün
    if (form.invalid || !this.imagesValid) {
      form.control.markAllAsTouched();
      this.swal.error("Eksik alanlar var", "Kırmızı işaretli alanları doldur.");
      return;
    }

    // YENİ: Onay penceresi
    const confirmed = await this.swal.confirm({
      title: this.isEditMode ? 'Değişiklikler kaydedilsin mi?' : 'Blog yayınlansın mı?',
      text: this.isEditMode
        ? 'Blog güncel haliyle yayında kalacak.'
        : 'Blog yayınlandığında sitede herkes görebilecek.',
      confirmText: this.isEditMode ? 'Evet, kaydet' : 'Evet, yayınla'
    });
    if (!confirmed) return;

    this.isSaving = true;
    this.errors = [];

    const formData = this.buildFormData();

    // Hangi istek gidecek? İkisi de Observable döndürüyor, subscribe kısmı ortak
    const request = this.isEditMode
      ? this.blogService.update(formData)
      : this.blogService.create(formData);

    request.subscribe({
      next: () => {
        this.swal.success(this.isEditMode ? "Blog güncellendi" : "Blog yayınlandı");
        this.goBack();
      },
      error: err => {
        this.isSaving = false;

        if (err.status === 400 && err.error?.errors) {
          // Validation ya da handler hatası → ilgili alanların altında / formun üstünde göster
          this.errors = err.error.errors;
          this.swal.error("Formda düzeltilmesi gereken alanlar var");
        } else {
          // 500 gibi beklenmeyen hatalarda middleware { errorMessage } döndürüyor
          this.swal.error(
            "Blog kaydedilemedi",
            err.error?.errors?.[0]?.errorMessage
              ?? err.error?.errorMessage
              ?? `Durum kodu: ${err.status}`
          );
          console.error(err);
        }
      }
    });
  }
  // Formu backend'in beklediği form-data'ya çevirir.
  // Anahtar adları backend'deki CreateBlogCommand / UpdateBlogCommand property adlarıyla aynı.
  // (ASP.NET form okurken büyük/küçük harfe bakmaz ama birebir yazmak okunurluğu artırıyor.)
  private buildFormData(): FormData {
    const formData = new FormData();

    if (this.isEditMode) {
      formData.append('Id', this.blogId);
    }

    formData.append('MainTitle', this.model.mainTitle ?? '');
    formData.append('MainDescription', this.model.mainDescription ?? '');
    formData.append('Title1', this.model.title1 ?? '');
    formData.append('Description1', this.model.description1 ?? '');
    formData.append('Description2', this.model.description2 ?? '');
    formData.append('Title2', this.model.title2 ?? '');
    formData.append('Description3', this.model.description3 ?? '');
    formData.append('Title3', this.model.title3 ?? '');
    formData.append('Description4', this.model.description4 ?? '');
    formData.append('CategoryId', this.model.categoryId);

    // Sadece seçilen resimler eklenir. Düzenlemede seçilmeyen resim gönderilmez → backend eskisini korur.
    // Object.keys: nesnenin anahtarları → ['CoverImage', 'BlogImage1', 'BlogImage2']
    (Object.keys(this.files) as ImageField[]).forEach(field => {
      const file = this.files[field];
      if (file) {
        formData.append(field, file, file.name);
      }
    });

    return formData;
  }

  // ---------------------------------------------------------------
  // GERİ DÖN
  // ---------------------------------------------------------------
  // route.parent: bu sayfanın bağlı olduğu panel rotası ('admin' ya da 'writer').
  // Ona göre "my-blogs" → /admin/my-blogs ya da /writer/my-blogs.
  // Böylece aynı component hangi panelden açıldıysa o panele döner.
   // DEĞİŞTİ: hangi listeden açıldıysa ona dön.
  // Rotadaki data.returnTo: Tüm bloglar'dan açıldıysa 'blogs', yoksa 'my-blogs'
  // route.parent: panel rotası ('admin' ya da 'writer')
  goBack() {
    const returnTo = this.route.snapshot.data['returnTo'] ?? 'my-blogs';
    this.router.navigate([returnTo], { relativeTo: this.route.parent });
  }

  // YENİ: üstteki "geri" butonunun yazısı (rotadan geliyor)
  get backLabel(): string {
    return this.route.snapshot.data['backLabel'] ?? 'Bloglarıma dön';
  }

  // Sayfadan çıkınca geçici önizleme adreslerini bırak
  ngOnDestroy(): void {
    this.revokePreview('CoverImage');
    this.revokePreview('BlogImage1');
    this.revokePreview('BlogImage2');
  }
}
