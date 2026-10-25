import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../../_services/dashboard-service';
import { AuthService } from '../../_services/auth-service';
import {
  computeDelta, DashboardPeriod, DeltaView, initialsOf,
  PERIOD_OPTIONS, PERIOD_TEXT, StatValue, WriterDashboardDto
} from '../../_models/dashboard';

interface WriterLevel { name: string; min: number; icon: string; }
interface StatTile { label: string; icon: string; tone: string; stat: StatValue; delta: DeltaView; }
interface CategoryBar { name: string; count: number; percent: number; }

// Piksel tema renkleri (styles.css → --px-...)
const PX = {
  ink: '#14201a',
  green: '#10b981',
  yellow: '#facc15',
  grid: 'rgba(20, 32, 26, 0.12)',
  font: "'Pixelify Sans', system-ui, sans-serif"
};

// =====================================================================
// YAZAR GENEL BAKIŞ (piksel tasarım)
// Veri gelince kartlar, seviye ve grafik BİR KEZ hazırlanır.
// =====================================================================
@Component({
  selector: 'app-writer-dashboard',
  standalone: false,
  templateUrl: './writer-dashboard.html',
  styleUrl: './writer-dashboard.css'
})
export class WriterDashboard implements OnInit {

  constructor(private dashboardService: DashboardService,
              private authService: AuthService) {}

  data: WriterDashboardDto | null = null;
  period: DashboardPeriod = '30d';
  readonly periods = PERIOD_OPTIONS;

  isLoading = true;
  isRefreshing = false;
  errorMessage = '';

  firstName = '';
  greeting = '';
  lastPublishedText = '';

  // Yazar seviyesi (toplam blog sayısına göre)
  readonly levels: WriterLevel[] = [
    { name: 'Çaylak', min: 0, icon: 'pi pi-pencil' },
    { name: 'Kalem', min: 3, icon: 'pi pi-book' },
    { name: 'Usta', min: 10, icon: 'pi pi-star' },
    { name: 'Efsane', min: 25, icon: 'pi pi-crown' }
  ];
  readonly segments = Array.from({ length: 10 }, (_, i) => i);
  level = this.levels[0];
  nextLevel: WriterLevel | null = this.levels[1];
  filledSegments = 0;
  blogsToNext = 0;

  // BİR KEZ hazırlananlar
  tiles: StatTile[] = [];
  categoryBars: CategoryBar[] = [];
  chartData: any = null;
  chartOptions: any = null;

  ngOnInit(): void {
    this.firstName = this.authService.getFullName().split(' ')[0] || 'Yazar';
    this.greeting = this.buildGreeting();
    this.buildChartOptions();
    this.load();
  }

  get periodText(): string {
    return PERIOD_TEXT[this.period];
  }

  setPeriod(period: DashboardPeriod) {
    if (period === this.period || this.isRefreshing) return;
    this.period = period;
    this.load(true);
  }

  load(refresh = false) {
    refresh ? this.isRefreshing = true : this.isLoading = true;
    this.errorMessage = '';

    this.dashboardService.getWriter(this.period).subscribe({
      next: result => {
        this.data = result.data;
        this.buildViews(result.data);
        this.isLoading = false;
        this.isRefreshing = false;
      },
      error: err => {
        this.isLoading = false;
        this.isRefreshing = false;
        this.errorMessage = err.error?.errors?.[0]?.errorMessage ?? 'Genel bakış yüklenemedi.';
      }
    });
  }

  // ---------------------------------------------------------------
  // VERİDEN GÖRÜNÜMÜ HAZIRLA (bir kez)
  // ---------------------------------------------------------------
  private buildViews(d: WriterDashboardDto) {
    this.tiles = [
      { label: 'Okunma', icon: 'pi pi-eye', tone: 'is-green', stat: d.views },
      { label: 'Gelen yorum', icon: 'pi pi-comments', tone: 'is-yellow', stat: d.comments },
      { label: 'Yeni yazı', icon: 'pi pi-file-edit', tone: 'is-pink', stat: d.blogs }
    ].map(t => ({ ...t, delta: computeDelta(t.stat) }));

    // SEVİYE: toplam blog sayısının yettiği en yüksek seviye
    const total = d.blogs.total;
    this.level = [...this.levels].reverse().find(l => total >= l.min) ?? this.levels[0];
    this.nextLevel = this.levels.find(l => l.min > total) ?? null;
    const progress = this.nextLevel
      ? ((total - this.level.min) / (this.nextLevel.min - this.level.min)) * 100
      : 100;
    this.filledSegments = Math.floor(progress / 10);
    this.blogsToNext = this.nextLevel ? this.nextLevel.min - total : 0;

    // SON YAZI
    this.lastPublishedText = this.buildLastPublished(d.lastPublishedAt);

    // KATEGORİ ÇUBUKLARI
    const max = Math.max(1, ...d.categories.map(c => c.count));
    this.categoryBars = d.categories.map(c => ({ name: c.name, count: c.count, percent: Math.round((c.count / max) * 100) }));

    // PİKSEL GRAFİK: okunma çubukları + basamaklı yorum çizgisi
    this.chartData = {
      labels: d.trend.map(p => p.label),
      datasets: [
        {
          type: 'bar', label: 'Okunma', data: d.trend.map(p => p.views), yAxisID: 'y',
          backgroundColor: PX.green, borderColor: PX.ink, borderWidth: 2, borderRadius: 0,
          barPercentage: 0.75, categoryPercentage: 0.9, maxBarThickness: 26
        },
        {
          type: 'line', label: 'Yorum', data: d.trend.map(p => p.comments), yAxisID: 'y1',
          borderColor: PX.yellow, backgroundColor: PX.yellow, borderWidth: 3,
          stepped: true,                     // 8-bit merdiven çizgi
          pointStyle: 'rect', pointRadius: 3, pointBorderColor: PX.ink, pointBorderWidth: 2
        }
      ]
    };
  }

  private buildChartOptions() {
    const font = { family: PX.font, size: 13 };

    this.chartOptions = {
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'bottom',
          labels: { usePointStyle: true, pointStyle: 'rect', boxWidth: 10, padding: 18, color: PX.ink, font }
        },
        tooltip: {
          backgroundColor: PX.ink, titleColor: PX.yellow, bodyColor: '#fff',
          cornerRadius: 0, padding: 10, borderColor: PX.green, borderWidth: 2,
          titleFont: font, bodyFont: font
        }
      },
      scales: {
        x: { grid: { display: false }, border: { color: PX.ink, width: 2 }, ticks: { maxTicksLimit: 10, color: PX.ink, font } },
        y: {
          beginAtZero: true, position: 'left',
          border: { color: PX.ink, width: 2 },
          grid: { color: PX.grid, borderDash: [4, 4] },
          ticks: { precision: 0, color: PX.ink, font }
        },
        y1: {
          beginAtZero: true, position: 'right',
          border: { color: PX.ink, width: 2 },
          grid: { drawOnChartArea: false },
          ticks: { precision: 0, color: '#a16207', font }
        }
      }
    };
  }

  private buildLastPublished(date?: string): string {
    if (!date) return 'Henüz yazı yayınlamadın. İlk yazın seni bekliyor!';
    const days = Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000);
    if (days === 0) return 'Son yazını bugün yayınladın. Harika gidiyorsun!';
    if (days === 1) return 'Son yazını dün yayınladın.';
    if (days < 30) return `Son yazını ${days} gün önce yayınladın.`;
    return `Son yazını ${days} gün önce yayınladın. Okurların seni özledi!`;
  }

  private buildGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 6) return 'İyi geceler';
    if (hour < 12) return 'Günaydın';
    if (hour < 18) return 'İyi günler';
    return 'İyi akşamlar';
  }

  initials(name: string): string {
    return initialsOf(name);
  }

  trackById(_: number, item: { id: string }) {
    return item.id;
  }
}
