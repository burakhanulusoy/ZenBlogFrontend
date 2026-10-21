import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BlogService } from '../../_services/blog-service';
import { CategoryService } from '../../_services/category-service';
import { SweetAlert } from '../../_services/sweet-alert';
import { BlogListDto } from '../../_models/blogListDto';
import { CategoryDto } from '../../_models/category';

// =====================================================================
// BLOGLARIM (ortak sayfa: /admin/my-blogs ve /writer/my-blogs)
// Giriş yapan kişinin KENDİ blogları (backend token'dan buluyor).
// Karta tıklayınca detay, Düzenle ile form, Sil ile onaylı silme.
// Görünüm: admin'de sade, writer'da piksel (CSS'te :host-context(.zb-pixel))
// =====================================================================
@Component({
  selector: 'app-my-blogs',
  standalone: false,
  templateUrl: './my-blogs.html',
  styleUrl: './my-blogs.css'
})
export class MyBlogs implements OnInit {

  constructor(private blogService: BlogService,
              private categoryService: CategoryService,
              private swal: SweetAlert,
              private router: Router,
              private route: ActivatedRoute) {}

  blogs: BlogListDto[] = [];
  filteredBlogs: BlogListDto[] = [];
  categories: CategoryDto[] = [];

  searchText = '';
  selectedCategoryId: string | null = null;

  isLoading = true;
  errorMessage = '';
  monthCount = 0;     // bu ay yazılan blog sayısı

  // Yüklenirken gösterilecek iskelet kart sayısı (*ngFor için)
  readonly skeletons = [1, 2, 3, 4, 5, 6];

  ngOnInit(): void {
    this.loadCategories();
    this.loadBlogs();
  }

  loadBlogs() {
    this.isLoading = true;
    this.errorMessage = '';

    this.blogService.getMyBlogs().subscribe({
      next: result => {
        this.blogs = result.data ?? [];
        this.calculateMonthCount();
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

  private calculateMonthCount() {
    const now = new Date();
    this.monthCount = this.blogs.filter(blog => {
      const date = new Date(blog.createdAt);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;
  }

  // ---------------------------------------------------------------
  // FİLTRE (getter değil metot: liste sadece filtre değişince yeniden hesaplanır)
  // ---------------------------------------------------------------
  applyFilters() {
    const search = this.searchText.trim().toLocaleLowerCase('tr');

    this.filteredBlogs = this.blogs.filter(blog =>
      (!search || blog.mainTitle?.toLocaleLowerCase('tr').includes(search))
      && (!this.selectedCategoryId || blog.categoryId === this.selectedCategoryId)
    );
  }

  onSearchChange(value: string) {
    this.searchText = value;
    this.applyFilters();
  }

  onCategoryChange(categoryId: string | null) {
    this.selectedCategoryId = categoryId;
    this.applyFilters();
  }

  get hasActiveFilter(): boolean {
    return !!this.searchText.trim() || !!this.selectedCategoryId;
  }

  clearFilters() {
    this.searchText = '';
    this.selectedCategoryId = null;
    this.applyFilters();
  }

  // ---------------------------------------------------------------
  // GEZİNME (göreli adres: hangi paneldeysek orada kalır)
  // ---------------------------------------------------------------

  // Detay: .../my-blogs/{id}
  view(blog: BlogListDto) {
    this.router.navigate([blog.id], { relativeTo: this.route });
  }

  // Kart klavyeyle seçilip Enter'a basılınca detaya git.
  // target === currentTarget: Enter kartın İÇİNDEKİ bir butonda basıldıysa kartı açma
   // Kart klavyeyle seçilip Enter'a basılınca detaya git.
  // target === currentTarget: Enter kartın İÇİNDEKİ bir butonda basıldıysa kartı açma
  // DEĞİŞTİ: KeyboardEvent → Event (strictTemplates, (keydown.enter)'daki $event'i Event olarak veriyor)
  onCardKeydown(event: Event, blog: BlogListDto) {
    if (event.target === event.currentTarget) {
      this.view(blog);
    }
  }

  // Düzenle: .../my-blogs/edit/{id}
  edit(blog: BlogListDto) {
    this.router.navigate(['edit', blog.id], { relativeTo: this.route });
  }

  // Yeni: .../new-blog  (../ → bir üst seviyeye çık, panel rotasına)
  goToNew() {
    this.router.navigate(['../new-blog'], { relativeTo: this.route });
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
        this.blogs = this.blogs.filter(b => b.id !== blog.id);
        this.calculateMonthCount();
        this.applyFilters();
        this.swal.success('Blog silindi');
      },
      error: err => {
        this.swal.error('Blog silinemedi', err.error?.errors?.[0]?.errorMessage);
      }
    });
  }
}
