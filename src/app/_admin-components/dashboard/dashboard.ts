import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../../_services/dashboard-service';
import { AuthService } from '../../_services/auth-service';
import { ROLE_LABELS } from '../../_models/user';
import {
  AdminDashboardDto, computeDelta, DashboardPeriod, DeltaView, initialsOf,
  PERIOD_OPTIONS, PERIOD_TEXT, StatValue
} from '../../_models/dashboard';

// Ana kart
interface KpiView {
  label: string;
  icon: string;
  tone: string;          // ikon rengi sınıfı
  stat: StatValue;
  delta: DeltaView;
  link: string | null;
}

// "Seni bekleyenler" satırı
interface PendingRow { label: string; count: number; icon: string; link: string; tone: string; }

// Rol çubuğu
interface RoleRow { label: string; count: number; percent: number; }

// Grafik renkleri (Chart.js CSS değişkeni okuyamaz; sabit renk veriyoruz)
const COLORS = {
  views: '#059669',
  viewsFill: 'rgba(5, 150, 105, 0.10)',
  comments: '#f59e0b',
  blogs: 'rgba(100, 116, 139, 0.35)',
  users: '#6366f1',
  palette: ['#059669', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6', '#64748b', '#ec4899', '#84cc16', '#f97316']
};

// =====================================================================
// ADMİN GENEL BAKIŞ
// Veri gelince kartlar ve grafik verisi BİR KEZ hazırlanır (şablonda yeni nesne üreten getter yok).
// Dönem değişince sayfa boşalmaz; eski veri soluklaşır, yenisi gelince yer değiştirir.
// =====================================================================
@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {

  constructor(private dashboardService: DashboardService,
              private authService: AuthService) {}

  data: AdminDashboardDto | null = null;
  period: DashboardPeriod = '30d';
  readonly periods = PERIOD_OPTIONS;

  isLoading = true;       // ilk yükleme (iskelet)
  isRefreshing = false;   // dönem değişimi (eski veri soluk)
  errorMessage = '';

  firstName = '';
  greeting = '';
  readonly today = new Date();

  // BİR KEZ hazırlananlar
  kpis: KpiView[] = [];
  pendingRows: PendingRow[] = [];
  pendingTotal = 0;
  roleRows: RoleRow[] = [];
  trendData: any = null;
  trendOptions: any = null;
  categoryData: any = null;
  categoryOptions: any = null;
  categoryLegend: { name: string; count: number; color: string }[] = [];

  ngOnInit(): void {
    this.firstName = this.authService.getFullName().split(' ')[0] || 'Yönetici';
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

    this.dashboardService.getAdmin(this.period).subscribe({
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
  private buildViews(d: AdminDashboardDto) {
    this.kpis = [
      { label: 'Okunma', icon: 'pi pi-eye', tone: 'is-green', stat: d.views, link: null },
      { label: 'Yeni blog', icon: 'pi pi-file-edit', tone: 'is-slate', stat: d.blogs, link: '/admin/blogs' },
      { label: 'Yeni üye', icon: 'pi pi-users', tone: 'is-indigo', stat: d.users, link: '/admin/users' },
      { label: 'Yorum', icon: 'pi pi-comments', tone: 'is-amber', stat: d.comments, link: '/admin/comments' }
    ].map(k => ({ ...k, delta: computeDelta(k.stat) }));

    this.pendingRows = [
      { label: 'Yazarlık başvurusu', count: d.pending.writerApplications, icon: 'pi pi-inbox', link: '/admin/writer-applications', tone: 'is-green' },
      { label: 'Okunmamış mesaj', count: d.pending.unreadMessages, icon: 'pi pi-envelope', link: '/admin/contact-messages', tone: 'is-indigo' },
      { label: 'Kapanma sürecindeki hesap', count: d.pending.pendingDeletions, icon: 'pi pi-clock', link: '/admin/users', tone: 'is-amber' },
      { label: 'Bloke hesap', count: d.pending.blockedUsers, icon: 'pi pi-ban', link: '/admin/users', tone: 'is-red' }
    ];
    this.pendingTotal = d.pending.writerApplications + d.pending.unreadMessages;

    const totalRoles = d.roles.reduce((sum, r) => sum + r.count, 0) || 1;
    this.roleRows = d.roles
      .map(r => ({ label: ROLE_LABELS[r.name] ?? r.name, count: r.count, percent: Math.round((r.count / totalRoles) * 100) }))
      .sort((a, b) => b.count - a.count);

    // TREND GRAFİĞİ: okunma sol eksende, diğerleri sağ eksende (ölçekleri çok farklı)
    this.trendData = {
      labels: d.trend.map(p => p.label),
      datasets: [
        {
          label: 'Okunma', data: d.trend.map(p => p.views), yAxisID: 'y',
          borderColor: COLORS.views, backgroundColor: COLORS.viewsFill, fill: true,
          tension: 0.35, borderWidth: 2.5, pointRadius: 0, pointHoverRadius: 5
        },
        {
          label: 'Yorum', data: d.trend.map(p => p.comments), yAxisID: 'y1',
          borderColor: COLORS.comments, backgroundColor: COLORS.comments,
          tension: 0.35, borderWidth: 2, pointRadius: 0, pointHoverRadius: 4
        },
        {
          label: 'Yeni üye', data: d.trend.map(p => p.users), yAxisID: 'y1',
          borderColor: COLORS.users, backgroundColor: COLORS.users, borderDash: [5, 4],
          tension: 0.35, borderWidth: 2, pointRadius: 0, pointHoverRadius: 4
        },
        {
          type: 'bar', label: 'Yeni blog', data: d.trend.map(p => p.blogs), yAxisID: 'y1',
          backgroundColor: COLORS.blogs, borderRadius: 4, barPercentage: 0.6, maxBarThickness: 18
        }
      ]
    };

    // KATEGORİ HALKASI
    const colors = d.categories.map((_, i) => COLORS.palette[i % COLORS.palette.length]);
    this.categoryData = {
      labels: d.categories.map(c => c.name),
      datasets: [{ data: d.categories.map(c => c.count), backgroundColor: colors, borderWidth: 0, hoverOffset: 6 }]
    };
    this.categoryLegend = d.categories.map((c, i) => ({ name: c.name, count: c.count, color: colors[i] }));
  }

  // Grafik ayarları (bir kez)
  private buildChartOptions() {
    const font = { family: "'Manrope', system-ui, sans-serif" };

    this.trendOptions = {
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },   // fareyle bir güne gelince o günün bütün değerleri
      plugins: {
        legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, padding: 18, font } },
        tooltip: { padding: 12, cornerRadius: 10, titleFont: { ...font, weight: '700' }, bodyFont: font }
      },
      scales: {
        x: { grid: { display: false }, ticks: { maxTicksLimit: 10, font, color: '#7a847e' } },
        y: {
          beginAtZero: true, position: 'left',
          ticks: { precision: 0, font, color: '#059669' },
          grid: { color: '#eef0ec' },
          title: { display: true, text: 'Okunma', font, color: '#059669' }
        },
        y1: {
          beginAtZero: true, position: 'right',
          ticks: { precision: 0, font, color: '#7a847e' },
          grid: { drawOnChartArea: false },   // ikinci eksenin çizgileri karışıklık yapmasın
          title: { display: true, text: 'Blog / yorum / üye', font, color: '#7a847e' }
        }
      }
    };

    this.categoryOptions = {
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: { legend: { display: false }, tooltip: { padding: 10, cornerRadius: 10, bodyFont: font } }
    };
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
