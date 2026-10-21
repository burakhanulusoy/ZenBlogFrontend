import { Component, OnInit } from '@angular/core';
import { BlogService } from '../../_services/blog-service';
import { SweetAlert } from '../../_services/sweet-alert';
import { BlogListDto } from '../../_models/blogListDto';

declare const alertify: any;

// =====================================================================
// BLOGLARIM: giriş yapan kişinin KENDİ blogları
// Ortak sayfa: hem admin (/admin/my-blogs) hem yazar (/writer/my-blogs) panelinde kullanılacak.
// Hangi panelden açılırsa o panelin menüsüyle görünür (layout'u rota belirliyor).
// =====================================================================
@Component({
  selector: 'app-my-blogs',
  standalone: false,
  templateUrl: './my-blogs.html',
  styleUrl: './my-blogs.css'
})
export class MyBlogs implements OnInit {

  constructor(private blogService: BlogService,
              private swal: SweetAlert) {}

  blogs: BlogListDto[] = [];
  isLoading = true;
  errorMessage = '';

  // Filtreler (HTML'deki arama kutusu ve kategori seçimine bağlı)
  searchText = '';
  selectedCategoryId = '';   // '' = tüm kategoriler

  ngOnInit(): void {
    this.loadBlogs();
  }

  // ---------------------------------------------------------------
  // LİSTELE
  // ---------------------------------------------------------------
  loadBlogs() {
    this.isLoading = true;
    this.errorMessage = '';

    this.blogService.getMyBlogs().subscribe({
      next: result => {
        // En yeni üstte (LINQ: OrderByDescending)
        this.blogs = (result.data ?? [])
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        this.isLoading = false;
      },
      error: err => {
        this.isLoading = false;
        this.errorMessage = err.status === 403
          ? "Bloglarına şu an erişilemiyor (yetki ayarları henüz tamamlanmadı)."
          : err.error?.errors?.[0]?.errorMessage ?? "Bloglar yüklenemedi.";
      }
    });
  }

  // ---------------------------------------------------------------
  // FİLTRELER (API'ye tekrar gitmeden, eldeki liste üzerinde)
  // ---------------------------------------------------------------

  // Bloglardaki kategorilerin tekrarsız listesi → kategori açılır listesi için
  // (LINQ: Select(b => b.Category).DistinctBy(c => c.Id))
  get categories(): { id: string; name: string }[] {
    const map = new Map<string, string>();
    this.blogs.forEach(b => {
      if (b.category) map.set(b.category.id, b.category.name);
    });
    return Array.from(map, ([id, name]) => ({ id, name }));
  }

  // Arama ve kategoriye göre süzülmüş liste → HTML bunu gösteriyor
  get filteredBlogs(): BlogListDto[] {
    // 'tr': Türkçe büyük/küçük harf kuralları (İ/i, I/ı doğru eşleşsin)
    const search = this.searchText.trim().toLocaleLowerCase('tr');

    return this.blogs.filter(b =>
      (!search || b.mainTitle?.toLocaleLowerCase('tr').includes(search)) &&
      (!this.selectedCategoryId || b.categoryId === this.selectedCategoryId)
    );
  }

  // Filtre uygulanmış mı? (boş sonuç ekranında "filtreleri temizle" göstermek için)
  get hasActiveFilter(): boolean {
    return !!this.searchText.trim() || !!this.selectedCategoryId;
  }

  clearFilters() {
    this.searchText = '';
    this.selectedCategoryId = '';
  }

  // ---------------------------------------------------------------
  // SİL
  // ---------------------------------------------------------------
  async delete(blog: BlogListDto) {

    const isConfirmed = await this.swal.areYouSure();
    if (!isConfirmed) return;

    this.blogService.delete(blog.id).subscribe({
      next: () => {
        alertify.success("Blog silindi.");
        // Listeyi API'den yeniden çekmek yerine silineni listeden çıkarıyoruz (daha hızlı)
        this.blogs = this.blogs.filter(b => b.id !== blog.id);
      },
      error: err => {
        alertify.error(err.error?.errors?.[0]?.errorMessage ?? "Blog silinemedi.");
      }
    });
  }
}
