import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { AboutService } from '../../_services/about-service';
import { SweetAlert } from '../../_services/sweet-alert';
import { ApiError } from '../../_models/result';

type ImageField = 'Image1' | 'Image2' | 'Image3';

// =====================================================================
// HAKKIMIZDA FORMU (yeni + düzenle) · sadece Admin
//   /admin/abouts/new        → yeni içerik (kaydedince YAYINA girer)
//   /admin/abouts/edit/:id   → düzenleme (resim seçmezsen eskisi kalır)
// =====================================================================
@Component({
  selector: 'app-about-form',
  standalone: false,
  templateUrl: './about-form.html',
  styleUrl: './about-form.css'
})
export class AboutForm implements OnInit, OnDestroy {

  constructor(private aboutService: AboutService,
              private swal: SweetAlert,
              private route: ActivatedRoute,
              private router: Router) {}

  aboutId: string | null = null;
  get isEditMode(): boolean { return !!this.aboutId; }

  model = { mainTitle: '', description: '', title1: '', title2: '', title3: '' };

  files: Record<ImageField, File | null> = { Image1: null, Image2: null, Image3: null };
  previews: Record<ImageField, string> = { Image1: '', Image2: '', Image3: '' };
  private originalImages: Record<ImageField, string> = { Image1: '', Image2: '', Image3: '' };
  fileErrors: Record<ImageField, string> = { Image1: '', Image2: '', Image3: '' };

  // Üç bölüm: şablonda *ngFor ile çizmek için (başlık alanı + resim alanı eşleşmesi)
  readonly blocks: { no: string; titleKey: 'title1' | 'title2' | 'title3'; titleField: string; image: ImageField }[] = [
    { no: '01', titleKey: 'title1', titleField: 'Title1', image: 'Image1' },
    { no: '02', titleKey: 'title2', titleField: 'Title2', image: 'Image2' },
    { no: '03', titleKey: 'title3', titleField: 'Title3', image: 'Image3' }
  ];

  errors: ApiError[] = [];
  isLoading = false;
  isSaving = false;
  loadError = '';
  submitted = false;

  readonly maxFileSize = 5 * 1024 * 1024;
  readonly allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  readonly acceptAttr = this.allowedExtensions.join(',');

  ngOnInit(): void {
    this.aboutId = this.route.snapshot.paramMap.get('id');
    if (this.isEditMode) this.loadAbout();
  }

  loadAbout() {
    this.isLoading = true;
    this.loadError = '';

    this.aboutService.getById(this.aboutId).subscribe({
      next: result => {
        const a = result.data;
        this.model = { mainTitle: a.mainTitle, description: a.description, title1: a.title1, title2: a.title2, title3: a.title3 };
        this.originalImages = { Image1: a.image1, Image2: a.image2, Image3: a.image3 };
        this.previews = { ...this.originalImages };
        this.isLoading = false;
      },
      error: err => {
        this.isLoading = false;
        this.loadError = err.status === 404 ? "İçerik bulunamadı." : (err.error?.errors?.[0]?.errorMessage ?? "İçerik yüklenemedi.");
      }
    });
  }

  // ---------------------------------------------------------------
  // RESİM
  // ---------------------------------------------------------------
  onFileSelected(event: Event, field: ImageField, input: HTMLInputElement) {
    this.fileErrors[field] = '';
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!this.allowedExtensions.includes(extension)) {
      this.fileErrors[field] = `Sadece ${this.allowedExtensions.join(', ')} dosyaları yüklenebilir.`;
      input.value = '';
      return;
    }
    if (file.size > this.maxFileSize) {
      this.fileErrors[field] = "Dosya boyutu en fazla 5 MB olabilir.";
      input.value = '';
      return;
    }

    this.revokePreview(field);
    this.files[field] = file;
    this.previews[field] = URL.createObjectURL(file);
    this.errors = this.errors.filter(e => !e.propertyName?.startsWith(field));
  }

  removeFile(field: ImageField, input: HTMLInputElement) {
    this.revokePreview(field);
    this.files[field] = null;
    this.previews[field] = this.originalImages[field];
    this.fileErrors[field] = '';
    input.value = '';
  }

  private revokePreview(field: ImageField) {
    if (this.previews[field]?.startsWith('blob:')) URL.revokeObjectURL(this.previews[field]);
  }

  isImageMissing(field: ImageField): boolean {
    return !this.isEditMode && !this.files[field];
  }

  get imagesValid(): boolean {
    return this.blocks.every(b => !this.isImageMissing(b.image));
  }

  getError(field: string): string | undefined {
    return this.errors.find(e => e.propertyName === field || e.propertyName?.startsWith(field + '.'))?.errorMessage;
  }

  get generalErrors(): ApiError[] {
    return this.errors.filter(e => !e.propertyName);
  }

  // ---------------------------------------------------------------
  // KAYDET
  // ---------------------------------------------------------------
  async save(form: NgForm) {
    this.submitted = true;
    if (form.invalid || !this.imagesValid) {
      form.control.markAllAsTouched();
      this.swal.error("Eksik alanlar var", "Kırmızı işaretli alanları doldur.");
      return;
    }

    const confirmed = await this.swal.confirm({
      title: this.isEditMode ? 'Değişiklikler kaydedilsin mi?' : 'Yeni içerik yayınlansın mı?',
      text: this.isEditMode
        ? 'Bu içerik yayındaysa değişiklikler sitede hemen görünür.'
        : 'Kaydedince bu içerik sitede yayına girer; mevcut içerik önceki sürümlere geçer.',
      confirmText: this.isEditMode ? 'Evet, kaydet' : 'Evet, yayınla'
    });
    if (!confirmed) return;

    this.isSaving = true;
    this.errors = [];

    const formData = new FormData();
    if (this.isEditMode) formData.append('Id', this.aboutId);
    formData.append('MainTitle', this.model.mainTitle.trim());
    formData.append('Description', this.model.description.trim());
    formData.append('Title1', this.model.title1.trim());
    formData.append('Title2', this.model.title2.trim());
    formData.append('Title3', this.model.title3.trim());
    this.blocks.forEach(b => {
      const file = this.files[b.image];
      if (file) formData.append(b.image, file, file.name);
    });

    const request = this.isEditMode ? this.aboutService.update(formData) : this.aboutService.create(formData);

    request.subscribe({
      next: () => {
        this.swal.success(this.isEditMode ? 'İçerik güncellendi' : 'İçerik yayınlandı');
        this.goBack();
      },
      error: err => {
        this.isSaving = false;
        if (err.status === 400 && err.error?.errors) {
          this.errors = err.error.errors;
          this.swal.error("Formda düzeltilmesi gereken alanlar var");
        } else {
          this.swal.error("Kaydedilemedi", err.error?.errorMessage ?? `Durum kodu: ${err.status}`);
        }
      }
    });
  }

  goBack() {
    this.router.navigate(['abouts'], { relativeTo: this.route.parent });
  }

  ngOnDestroy(): void {
    this.blocks.forEach(b => this.revokePreview(b.image));
  }
}
