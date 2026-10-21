import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { CategoryService } from '../../_services/category-service';
import { SweetAlert } from '../../_services/sweet-alert';
import { CategoryDto } from '../../_models/category';
import { ApiError } from '../../_models/result';

// =====================================================================
// KATEGORİLER (sadece Admin, Site yönetimi)
// Listele + ara + ekle + güncelle + sil.
// Ekleme ve güncelleme TEK pencerede (p-dialog): isEditMode'a göre davranıyor.
// Kaydedince sayfa yenilenmiyor; pencere kapanıp liste API'den tekrar çekiliyor.
// =====================================================================
@Component({
  selector: 'admin-category',
  standalone: false,
  templateUrl: './category.html',
  styleUrl: './category.css'
})
export class Category implements OnInit {

  constructor(private categoryService: CategoryService,
              private swal: SweetAlert) {}

  // ---------------------------------------------------------------
  // LİSTE
  // ---------------------------------------------------------------
  categories: CategoryDto[] = [];        // API'den gelen hepsi
  filteredCategories: CategoryDto[] = []; // aramadan geçenler (tabloda bunlar)
  searchText = '';

  isLoading = true;
  errorMessage = '';

  // ---------------------------------------------------------------
  // PENCERE (ekle / güncelle)
  // ---------------------------------------------------------------
  dialogVisible = false;
  isEditMode = false;
  isSaving = false;

  // Penceredeki formun verisi → [(ngModel)]="form.name"
  // Güncellemede id de dolu; backend'deki UpdateCategoryCommand { Id, Name } ile uyuşuyor
    form: CategoryDto = new CategoryDto();

  // API hataları: [{ propertyName: "Name", errorMessage: "..." }]
  errors: ApiError[] = [];

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories() {
    this.isLoading = true;
    this.errorMessage = '';

    this.categoryService.getCategories().subscribe({
      next: result => {
        this.categories = result.data ?? [];
        this.applyFilter();
        this.isLoading = false;
      },
      error: err => {
        this.isLoading = false;
        this.errorMessage = err.error?.errors?.[0]?.errorMessage ?? "Kategoriler yüklenemedi.";
      }
    });
  }

  // Arama (LINQ: categories.Where(c => c.Name.Contains(search)))
  applyFilter() {
    const search = this.searchText.trim().toLocaleLowerCase('tr');
    this.filteredCategories = this.categories.filter(c =>
      !search || c.name?.toLocaleLowerCase('tr').includes(search));
  }

  onSearchChange(value: string) {
    this.searchText = value;
    this.applyFilter();
  }

  // ---------------------------------------------------------------
  // PENCEREYİ AÇ
  // ---------------------------------------------------------------
  openCreate() {
    this.isEditMode = false;
        this.form = new CategoryDto();   // DEĞİŞTİ
    this.errors = [];
    this.dialogVisible = true;
  }

  // { id, name } → yeni bir nesne: tablodaki satırla aynı nesne olmasın
  // (yoksa pencerede yazdıkça tablodaki isim de değişir)
  openEdit(category: CategoryDto) {
    this.isEditMode = true;
        // DEĞİŞTİ: yeni bir CategoryDto, değerleri satırdan kopyala (tablodaki nesneyle aynı olmasın)
    this.form = Object.assign(new CategoryDto(), { id: category.id, name: category.name });
    this.errors = [];
    this.dialogVisible = true;
  }

  // "Name" alanına ait API hatası
  get nameError(): string | undefined {
    return this.errors.find(e => e.propertyName === 'Name')?.errorMessage;
  }

  // Bir alana bağlı olmayan API hataları ("Kategori bulunamadı" gibi)
  get otherErrors(): ApiError[] {
    return this.errors.filter(e => e.propertyName !== 'Name');
  }

  // ---------------------------------------------------------------
  // KAYDET (ekle ya da güncelle)
  // ---------------------------------------------------------------
  save(categoryForm: NgForm) {
    if (categoryForm.invalid) {
      categoryForm.control.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.errors = [];

    // Hangi istek? İkisi de Observable döndürüyor, subscribe kısmı ortak
    const request = this.isEditMode
      ? this.categoryService.update(this.form)
      : this.categoryService.create(this.form);

    request.subscribe({
      next: () => {
        this.isSaving = false;
        this.dialogVisible = false;
        this.swal.success(this.isEditMode ? 'Kategori güncellendi' : 'Kategori eklendi');
        this.loadCategories();   // API eklenen/güncellenen veriyi dönmüyor → listeyi yeniden çek
      },
      error: err => {
        this.isSaving = false;

        if (err.status === 400 && err.error?.errors) {
          // Validation hatası → pencere açık kalır, hata input'un altında görünür
          this.errors = err.error.errors;
        } else {
          this.swal.error('Kategori kaydedilemedi', err.error?.errorMessage ?? `Durum kodu: ${err.status}`);
        }
      }
    });
  }

  // ---------------------------------------------------------------
  // SİL
  // ---------------------------------------------------------------
  async deleteCategory(category: CategoryDto) {
    const confirmed = await this.swal.confirm({
      title: 'Kategori silinsin mi?',
      text: `"${category.name}" kategorisi kaldırılacak.`,
      confirmText: 'Evet, sil',
      danger: true
    });
    if (!confirmed) return;

    this.categoryService.delete(category.id).subscribe({
      next: () => {
        this.swal.success('Kategori silindi');
        this.loadCategories();
      },
      error: err => {
        this.swal.error('Kategori silinemedi', err.error?.errors?.[0]?.errorMessage);
      }
    });
  }
}
