import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BlogService } from '../../_services/blog-service';
import { CategoryService } from '../../_services/category-service';
import { SweetAlert } from '../../_services/sweet-alert';
import { BlogListDto } from '../../_models/blogListDto';
import { CategoryDto } from '../../_models/category';

// =====================================================================
// TÜM BLOGLAR (sadece Admin, Site yönetimi)
// Sitedeki bütün blogları tabloda gösterir: arama, kategori filtresi,
// sıralama, sayfalama. Satıra tıklayınca blog detayına gider.
// Adres: /admin/blogs   (kategori seçili açmak için: /admin/blogs?category=<id>)
// =====================================================================
@Component({
  selector: 'app-all-blogs',
  standalone: false,
  templateUrl: './all-blogs.html',
  styleUrl: './all-blogs.css'
})
export class AllBlogs implements OnInit {

  constructor(private blogService: BlogService,
              private categoryService: CategoryService,
              private swal: SweetAlert,
              private router: Router,
              private route: ActivatedRoute) {}

  blogs: BlogListDto[] = [];           // API'den gelen bütün bloglar
  filteredBlogs: BlogListDto[] = [];   // arama + filtreden geçenler (tabloda bunlar görünüyor)
  categories: CategoryDto[] = [];

  searchText = '';
  selectedCategoryId: string | null = null;

  isLoading = true;
  errorMessage = '';

  // Üstteki özet kartları
    // Üstteki özet kartları
  // DEĞİŞTİ: tarih aralıklarına göre sayılar
  todayCount = 0;
  weekCount = 0;
  monthCount = 0;
  last3MonthsCount = 0;

  ngOnInit(): void {
    // Adreste ?category=... varsa o kategori seçili başlasın
    // (Kategoriler sayfasından "Bu kategorinin blogları"na tıklayınca böyle gelinecek)
    this.selectedCategoryId = this.route.snapshot.queryParamMap.get('category');

    this.loadCategories();
    this.loadBlogs();
  }

  loadBlogs() {
    this.isLoading = true;
    this.errorMessage = '';

    this.blogService.getAll().subscribe({
      next: result => {
        this.blogs = result.data ?? [];
        this.calculateStats();
        this.applyFilters();
        this.isLoading = false;
      },
      error: err => {
        this.isLoading = false;
        this.errorMessage = err.error?.errors?.[0]?.errorMessage ?? "Bloglar yüklenemedi.";
      }
    });
  }

  loadCategories() {
    this.categoryService.getCategories().subscribe({
      next: result => this.categories = result.data ?? [],
      error: () => this.swal.error("Kategoriler yüklenemedi.")
    });
  }

  // ---------------------------------------------------------------
  // FİLTRE
  // Not: filteredBlogs'u getter yerine bu metotla hesaplıyoruz. Getter her ekran
  // yenilemesinde YENİ bir dizi üretir; p-table de her seferinde baştan çizmeye kalkar.
  // ---------------------------------------------------------------
  applyFilters() {
    // toLocaleLowerCase('tr'): "İ" → "i", "I" → "ı" (Türkçe'ye uygun küçük harf)
    const search = this.searchText.trim().toLocaleLowerCase('tr');

    // LINQ: blogs.Where(b => ...).ToList()
    this.filteredBlogs = this.blogs.filter(blog => {
      const matchesSearch = !search
        || blog.mainTitle?.toLocaleLowerCase('tr').includes(search)
        || this.authorName(blog).toLocaleLowerCase('tr').includes(search);

      const matchesCategory = !this.selectedCategoryId || blog.categoryId === this.selectedCategoryId;

      return matchesSearch && matchesCategory;
    });
  }

  onSearchChange(value: string) {
    this.searchText = value;
    this.applyFilters();
  }

  onCategoryChange(categoryId: string | null) {
    this.selectedCategoryId = categoryId;
    this.applyFilters();
    this.updateCategoryInUrl();
  }

  get hasActiveFilter(): boolean {
    return !!this.searchText.trim() || !!this.selectedCategoryId;
  }

  clearFilters() {
    this.searchText = '';
    this.selectedCategoryId = null;
    this.applyFilters();
    this.updateCategoryInUrl();
  }

  // Seçili kategoriyi adrese yaz (sayfa yenilenince ya da link paylaşılınca seçim kaybolmasın)
  // navigate([]): aynı sayfada kal, sadece ?category=... kısmını değiştir
  // replaceUrl: her seçimde tarayıcı geçmişine yeni kayıt eklemesin (Geri tuşu bozulmasın)
  private updateCategoryInUrl() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { category: this.selectedCategoryId || null },
      replaceUrl: true
    });
  }

  // ---------------------------------------------------------------
  // ÖZET
  // ---------------------------------------------------------------
   // DEĞİŞTİ: bugün / bu hafta / bu ay / son 3 ay
  private calculateStats() {
    const now = new Date();

    // Bugünün başı: 00:00
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Haftanın başı: Pazartesi 00:00
    // getDay(): Pazar=0, Pazartesi=1 ... Cumartesi=6 → (getDay()+6)%7 ile Pazartesi=0 yapıyoruz
    const daysSinceMonday = (now.getDay() + 6) % 7;
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - daysSinceMonday);

    // Ayın başı: ayın 1'i 00:00
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Son 3 ay: bugünden 3 ay öncesi (örn. 21 Ekim → 21 Temmuz)
    const threeMonthsAgo = new Date(startOfToday);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    // Verilen tarihten sonra yayınlanan blog sayısı
    // LINQ: blogs.Count(b => b.CreatedAt >= start)
    const countSince = (start: Date) =>
      this.blogs.filter(blog => new Date(blog.createdAt) >= start).length;

    this.todayCount = countSince(startOfToday);
    this.weekCount = countSince(startOfWeek);
    this.monthCount = countSince(startOfMonth);
    this.last3MonthsCount = countSince(threeMonthsAgo);
  }

  // ---------------------------------------------------------------
  // YAZAR
  // ---------------------------------------------------------------
  authorName(blog: BlogListDto): string {
    const name = `${blog.appUser?.name ?? ''} ${blog.appUser?.surname ?? ''}`.trim();
    return name || 'Bilinmeyen yazar';
  }

  authorInitials(blog: BlogListDto): string {
    return this.authorName(blog)
      .split(' ')
      .filter(part => part)
      .map(part => part[0].toLocaleUpperCase('tr'))
      .slice(0, 2)
      .join('');
  }

  // ---------------------------------------------------------------
  // İŞLEMLER
  // ---------------------------------------------------------------

  // Detay: /admin/blogs/{id}
  view(blog: BlogListDto) {
    this.router.navigate([blog.id], { relativeTo: this.route });
  }




  async deleteBlog(blog: BlogListDto) {
    const confirmed = await this.swal.confirm({
      title: 'Blog silinsin mi?',
      text: `"${blog.mainTitle}" yayından kaldırılacak.`,
      confirmText: 'Evet, sil',
      danger: true
    });
    if (!confirmed) return;

    this.blogService.delete(blog.id).subscribe({
      next: () => {
        // API'den yeniden çekmek yerine silineni listeden çıkar (daha hızlı)
        this.blogs = this.blogs.filter(b => b.id !== blog.id);
        this.calculateStats();
        this.applyFilters();
        this.swal.success('Blog silindi');
      },
      error: err => {
        this.swal.error('Blog silinemedi', err.error?.errors?.[0]?.errorMessage);
      }
    });
  }
}
