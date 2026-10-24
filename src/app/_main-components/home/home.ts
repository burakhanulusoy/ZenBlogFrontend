import { Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import Swiper from 'swiper';
import { A11y, Autoplay, Navigation, Pagination } from 'swiper/modules';
import { HomeService } from '../../_services/home-service';
import { HomeBlogDto, HomeCategorySectionDto, HomePageDto } from '../../_models/home';

// Kategori bölümü: öne çıkan blog + kalan kartlar (bir kez hesaplanıp saklanıyor)
interface CategorySectionView {
  categoryId: string;
  categoryName: string;
  feature: HomeBlogDto;
  rest: HomeBlogDto[];
}

// =====================================================================
// ANA SAYFA
//   Slider (son 3) → Son bloglar (7) + Trending (en çok yorum alan 5) → Kategori bölümleri (her biri son 5)
// Kurallar:
// 1) Şablonda yeni dizi üreten getter yok; listeler veri gelince BİR KEZ hazırlanıyor.
// 2) Swiper Angular dışında (NgZone.runOutsideAngular) çalışıyor.
// 3) Belirme efekti AOS yerine appReveal direktifiyle (her bölüm kendi gözlemcisini taşıyor).
// =====================================================================
@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit, OnDestroy {

  constructor(private homeService: HomeService,
              private zone: NgZone) {}

  home: HomePageDto | null = null;
  isLoading = true;
  errorMessage = '';

  latestFeature: HomeBlogDto | null = null;
  latestColumns: HomeBlogDto[][] = [];
  sections: CategorySectionView[] = [];

  private swiper?: Swiper;

  // Slider kutusu ekrana çizildiği AN Angular bu setter'ı çağırır → Swiper o zaman başlar
  @ViewChild('heroSwiper')
  set heroSwiperRef(ref: ElementRef<HTMLElement> | undefined) {
    if (ref && !this.swiper) {
      this.initSwiper(ref.nativeElement);
    }
  }

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.isLoading = true;
    this.errorMessage = '';

    this.homeService.getHome().subscribe({
      next: result => {
        this.home = result.data;
        this.buildViews(result.data);
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = "İçerikler şu anda yüklenemedi. Lütfen biraz sonra tekrar dene.";
      }
    });
  }

  // Listeleri BİR KEZ hazırla
  private buildViews(data: HomePageDto) {
    this.latestFeature = data.latest[0] ?? null;
    this.latestColumns = [data.latest.slice(1, 4), data.latest.slice(4, 7)]
      .filter(column => column.length > 0);

    this.sections = data.categorySections
      .filter((s: HomeCategorySectionDto) => s.blogs.length > 0)
      .map(s => ({
        categoryId: s.categoryId,
        categoryName: s.categoryName,
        feature: s.blogs[0],
        rest: s.blogs.slice(1)
      }));
  }

  // Swiper: Angular dışında başlat (otomatik kaydırma zamanlayıcısı Angular'ı tetiklemesin)
  private initSwiper(el: HTMLElement) {
    this.zone.runOutsideAngular(() => {
      this.swiper = new Swiper(el, {
        modules: [Navigation, Pagination, Autoplay, A11y],
        rewind: true,
        speed: 700,
        autoplay: {
          delay: 6000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true
        },
        pagination: {
          el: el.querySelector('.swiper-pagination') as HTMLElement,
          clickable: true
        },
        navigation: {
          nextEl: el.querySelector('.hero-next') as HTMLElement,
          prevEl: el.querySelector('.hero-prev') as HTMLElement
        },
        a11y: {
          prevSlideMessage: 'Önceki yazı',
          nextSlideMessage: 'Sonraki yazı',
          paginationBulletMessage: '{{index}}. yazıya git'
        }
      });
    });
  }

  get isEmpty(): boolean {
    return !!this.home && this.home.slider.length === 0 && this.home.latest.length === 0;
  }

  initials(name: string): string {
    return (name ?? '').split(' ').filter(p => p).map(p => p[0].toLocaleUpperCase('tr')).slice(0, 2).join('');
  }

  trackById(_: number, item: { id: string }) {
    return item.id;
  }

  trackBySection(_: number, section: CategorySectionView) {
    return section.categoryId;
  }

  trackByIndex(index: number) {
    return index;
  }

  ngOnDestroy(): void {
    this.swiper?.destroy(true, true);
  }
}
