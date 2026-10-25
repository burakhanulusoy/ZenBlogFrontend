import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, combineLatest } from 'rxjs';
import { SiteBlogService } from '../../_services/site-blog-service';
import { SiteService } from '../../_services/site-service';
import { CategoryPageDto } from '../../_models/site-blog';
import { CategoryDto } from '../../_models/category';

// =====================================================================
// SİTE: KATEGORİ SAYFASI  →  /category/:id?page=2
// Sayfa numarası adreste: yenileyince/paylaşınca aynı sayfa açılır, geri tuşu çalışır.
// Hem adres parametresini (id) hem sorgu parametresini (page) BİRLİKTE dinliyoruz (combineLatest):
// kategori de sayfa da değişse veriler yeniden yüklenir; component yeniden oluşturulmaz.
// =====================================================================
@Component({
  selector: 'app-site-category',
  standalone: false,
  templateUrl: './site-category.html',
  styleUrl: './site-category.css'
})
export class SiteCategory implements OnInit, OnDestroy {

  constructor(private route: ActivatedRoute,
              private router: Router,
              private siteBlogService: SiteBlogService,
              private siteService: SiteService) {}

  data: CategoryPageDto | null = null;
  categories: CategoryDto[] = [];   // üstteki kategori etiketleri
  pages: (number | '...')[] = [];   // sayfalama düğmeleri (veri gelince BİR KEZ hesaplanır)

  isLoading = true;
  notFound = false;
  errorMessage = '';

  readonly pageSize = 9;
  private subscriptions = new Subscription();

  ngOnInit(): void {
    // Kategori etiketleri (SiteService önbellekli → header ile aynı veri, yeni istek yok)
    this.subscriptions.add(this.siteService.getCategories().subscribe(c => this.categories = c));

    // Adres (id) + sorgu (page) birlikte
    this.subscriptions.add(
      combineLatest([this.route.paramMap, this.route.queryParamMap]).subscribe(([params, query]) => {
        const id = params.get('id');
        const page = Number(query.get('page')) || 1;
        if (id) this.load(id, page);
      })
    );
  }

  load(categoryId: string, page: number) {
    this.isLoading = true;
    this.notFound = false;
    this.errorMessage = '';

    this.siteBlogService.getCategoryPage(categoryId, page, this.pageSize).subscribe({
      next: result => {
        this.data = result.data;
        this.pages = this.buildPages(result.data.page, result.data.totalPages);
        this.isLoading = false;
      },
      error: err => {
        this.isLoading = false;
        this.data = null;
        if (err.status === 404) {
          this.notFound = true;
        } else {
          this.errorMessage = "Yazılar şu anda yüklenemedi. Lütfen biraz sonra tekrar dene.";
        }
      }
    });
  }

  // Sayfa numaraları: 1 … 4 5 6 … 12 (çok sayfa varsa araları "…" ile kısalt)
  private buildPages(current: number, total: number): (number | '...')[] {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages: (number | '...')[] = [1];
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    if (start > 2) pages.push('...');
    for (let p = start; p <= end; p++) pages.push(p);
    if (end < total - 1) pages.push('...');

    pages.push(total);
    return pages;
  }

  // Sayfa değiştir: adresi güncelle → combineLatest yeni sayfayı yükler
  // (router ayarındaki scrollPositionRestoration sayesinde sayfa başına kayar)
  goToPage(page: number | '...') {
    if (page === '...' || !this.data || page === this.data.page) return;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: page === 1 ? null : page },   // 1. sayfada adres temiz kalsın
      queryParamsHandling: 'merge'
    });
  }

  isPageNumber(p: number | '...'): p is number {
    return p !== '...';
  }

  trackById(_: number, item: { id: string }) {
    return item.id;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
