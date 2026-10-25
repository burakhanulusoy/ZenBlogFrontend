import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { PaginatorState } from 'primeng/paginator';
import { LogService } from '../../_services/log-service';
import { SweetAlert } from '../../_services/sweet-alert';
import {
  EVENT_META, LEVEL_META, LOG_PERIODS, LogDetailDto, LogEntryDto, LogFilter, LogPeriod, LogSummaryDto
} from '../../_models/log';

interface KpiView { key: string; label: string; value: string; icon: string; tone: string; clickable: boolean; hint: string; }
interface EventView { name: string; label: string; icon: string; tone: string; count: number; percent: number; }
interface SlowView { path: string; display: string; avgMs: number; count: number; percent: number; tone: string; }
interface FieldRow { key: string; value: string; userName?: string; }
interface ErrorView { type?: string; message?: string; stack?: string; }

// Grafik renkleri (Chart.js CSS değişkeni okuyamaz)
const COLORS = { info: '#10b981', warn: '#f59e0b', error: '#ef4444' };

// Adreslerdeki Guid'ler: /api/users/117a28d9-... -> /api/users/{id}
const GUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

// =====================================================================
// ADMİN: LOG KAYITLARI
// Elasticsearch'teki loglar: özet kartlar, zaman grafiği, olaylar, en yavaş uçlar,
// filtreli + sayfalı liste ve sağdan açılan detay paneli.
// Kural: şablonda yeni nesne/dizi üreten getter YOK; görünüm verileri veri gelince BİR KEZ hazırlanır.
// =====================================================================
@Component({
  selector: 'app-system-logs',
  standalone: false,
  templateUrl: './system-logs.html',
  styleUrl: './system-logs.css'
})
export class SystemLogs implements OnInit, OnDestroy {

  constructor(private logService: LogService,
              private swal: SweetAlert) {}

  readonly periods = LOG_PERIODS;
  readonly levelOptions = [
    { value: 'Information', label: 'Bilgi', tone: 'info' },
    { value: 'Warning', label: 'Uyarı', tone: 'warn' },
    { value: 'Error', label: 'Hata', tone: 'danger' }
  ];
  // Olay türü açılır listesi (BİR KEZ hazırlanır)
  readonly eventOptions = Object.entries(EVENT_META).map(([value, meta]) => ({ value, label: meta.label }));

  // FİLTRELER
  filter: LogFilter = {
    period: '24h', levels: [], eventType: null, search: '',
    userId: null, traceId: null, onlyEvents: false, page: 1, pageSize: 25
  };
  userFilterName = '';
  searchText = '';

  // ÖZET
  summary: LogSummaryDto | null = null;
  kpis: KpiView[] = [];
  eventsView: EventView[] = [];
  slowView: SlowView[] = [];
  chartData: any = null;
  chartOptions: any = null;
  isSummaryLoading = true;

  // LİSTE
  logs: LogEntryDto[] = [];
  total = 0;
  isLogsLoading = true;

  // DURUM
  unavailable = false;        // Elasticsearch'e ulaşılamıyor (503)
  errorMessage = '';
  autoRefresh = false;

  // DETAY
  drawerVisible = false;
  detailEntry: LogEntryDto | null = null;
  detail: LogDetailDto | null = null;
  detailFields: FieldRow[] = [];
  detailError: ErrorView | null = null;
  isDetailLoading = false;

  private search$ = new Subject<string>();
  private subscriptions = new Subscription();
  private refreshTimer: any = null;

  ngOnInit(): void {
    this.buildChartOptions();

    // ARAMA: kullanıcı yazmayı bitirince (400 ms durunca) ara; aynı metni tekrar arama
    this.subscriptions.add(
      this.search$.pipe(debounceTime(400), distinctUntilChanged()).subscribe(text => {
        this.filter.search = text;
        this.filter.page = 1;
        this.loadLogs();
      })
    );

    this.loadAll();
  }

  // ---------------------------------------------------------------
  // YÜKLEME
  // ---------------------------------------------------------------
  loadAll(silent = false) {
    this.loadSummary(silent);
    this.loadLogs(silent);
  }

  loadSummary(silent = false) {
    if (!silent) this.isSummaryLoading = true;

    this.logService.getSummary(this.filter.period).subscribe({
      next: result => {
        this.unavailable = false;
        this.summary = result.data;
        this.buildSummaryView(result.data);
        this.isSummaryLoading = false;
      },
      error: err => {
        this.isSummaryLoading = false;
        this.handleError(err);
      }
    });
  }

  loadLogs(silent = false) {
    if (!silent) this.isLogsLoading = true;

    this.logService.getLogs(this.filter).subscribe({
      next: result => {
        this.unavailable = false;
        this.logs = result.data.items;
        this.total = result.data.total;
        this.isLogsLoading = false;
      },
      error: err => {
        this.isLogsLoading = false;
        this.handleError(err);
      }
    });
  }

  private handleError(err: any) {
    if (err.status === 503) {
      this.unavailable = true;   // Elasticsearch kapalı
    } else {
      this.errorMessage = err.error?.errors?.[0]?.errorMessage ?? 'Loglar yüklenemedi.';
    }
  }

  // ---------------------------------------------------------------
  // ÖZET GÖRÜNÜMÜ (veri gelince BİR KEZ)
  // ---------------------------------------------------------------
  private buildSummaryView(s: LogSummaryDto) {
    const format = (n: number) => n.toLocaleString('tr-TR');

    this.kpis = [
      { key: 'total', label: 'Toplam log', value: format(s.total), icon: 'pi pi-list', tone: 'slate', clickable: false, hint: '' },
      { key: 'errors', label: 'Hatalar', value: format(s.errors), icon: 'pi pi-times-circle', tone: 'red', clickable: true, hint: 'Hataları listele' },
      { key: 'warnings', label: 'Uyarılar', value: format(s.warnings), icon: 'pi pi-exclamation-triangle', tone: 'amber', clickable: true, hint: 'Uyarıları listele' },
      { key: 'failedLogins', label: 'Başarısız giriş', value: format(s.failedLogins), icon: 'pi pi-lock', tone: 'amber', clickable: true, hint: 'Başarısız girişleri listele' },
      { key: 'avg', label: 'Ort. yanıt süresi', value: s.avgDurationMs != null ? `${format(Math.round(s.avgDurationMs))} ms` : '—', icon: 'pi pi-stopwatch', tone: 'indigo', clickable: false, hint: '' },
      { key: 'server', label: 'Sunucu hatası (5xx)', value: format(s.serverErrors), icon: 'pi pi-server', tone: s.serverErrors > 0 ? 'red' : 'green', clickable: false, hint: '' }
    ];

    // ÖNEMLİ OLAYLAR: en sık olana göre oran çubuğu
    const maxEvent = Math.max(1, ...s.events.map(e => e.count));
    this.eventsView = s.events.map(e => ({
      name: e.name,
      label: this.eventLabel(e.name),
      icon: this.eventIcon(e.name),
      tone: this.eventTone(e.name),
      count: e.count,
      percent: Math.max(4, Math.round((e.count / maxEvent) * 100))
    }));

    // EN YAVAŞ UÇLAR: en yavaşa göre çubuk, süreye göre renk
    const maxSlow = Math.max(1, ...s.slowest.map(x => x.avgMs));
    this.slowView = s.slowest.map(x => ({
      path: x.path,
      display: x.path.replace(GUID_PATTERN, '{id}'),
      avgMs: x.avgMs,
      count: x.count,
      percent: Math.max(4, Math.round((x.avgMs / maxSlow) * 100)),
      tone: x.avgMs >= 1000 ? 'danger' : x.avgMs >= 500 ? 'warn' : 'success'
    }));

    // ZAMAN GRAFİĞİ: yığılmış çubuklar (bilgi / uyarı / hata)
    this.chartData = {
      labels: s.timeline.map(p => this.formatBucket(p.time)),
      datasets: [
        { label: 'Bilgi', data: s.timeline.map(p => p.information), backgroundColor: COLORS.info, stack: 'logs', borderRadius: 4, maxBarThickness: 26 },
        { label: 'Uyarı', data: s.timeline.map(p => p.warning), backgroundColor: COLORS.warn, stack: 'logs', borderRadius: 4, maxBarThickness: 26 },
        { label: 'Hata', data: s.timeline.map(p => p.error), backgroundColor: COLORS.error, stack: 'logs', borderRadius: 4, maxBarThickness: 26 }
      ]
    };
  }

  private buildChartOptions() {
    const font = { family: "'Manrope', system-ui, sans-serif" };
    this.chartOptions = {
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },   // kendi lejantımızı başlıkta gösteriyoruz
        tooltip: {
          backgroundColor: '#0f172a', padding: 12, cornerRadius: 10,
          titleFont: { ...font, weight: '700' }, bodyFont: font,
          usePointStyle: true, boxPadding: 4
        }
      },
      scales: {
        x: { stacked: true, grid: { display: false }, border: { display: false }, ticks: { maxTicksLimit: 12, font, color: '#7a847e' } },
        y: { stacked: true, beginAtZero: true, border: { display: false }, ticks: { precision: 0, font, color: '#7a847e' }, grid: { color: '#eef0ec' } }
      }
    };
  }

  // Grafik eksen etiketi: döneme göre saat ya da gün
  private formatBucket(iso: string): string {
    const d = new Date(iso);
    switch (this.filter.period) {
      case '1h':
      case '24h': return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      case '7d': return d.toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
      default: return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    }
  }

  get periodText(): string {
    return this.periods.find(p => p.value === this.filter.period)?.label ?? '';
  }

  // ---------------------------------------------------------------
  // FİLTRELER
  // ---------------------------------------------------------------
  setPeriod(period: LogPeriod) {
    if (this.filter.period === period) return;
    this.filter.period = period;
    this.filter.page = 1;
    this.loadAll();
  }

  onSearchInput(text: string) {
    this.searchText = text;
    this.search$.next(text);
  }

  clearSearch() {
    this.onSearchInput('');
  }

  isLevelOn(level: string): boolean {
    return this.filter.levels.includes(level);
  }

  toggleLevel(level: string) {
    this.filter.levels = this.isLevelOn(level)
      ? this.filter.levels.filter(l => l !== level)
      : [...this.filter.levels, level];
    this.reloadFirstPage();
  }

  onEventTypeChange() {
    this.reloadFirstPage();
  }

  onOnlyEventsChange() {
    this.reloadFirstPage();
  }

  filterByUser(id: string | undefined, name: string | undefined, event?: Event) {
    event?.stopPropagation();   // satıra tıklanmış sayılmasın (detay açılmasın)
    if (!id) return;
    this.filter.userId = id;
    this.userFilterName = name || id;
    this.drawerVisible = false;
    this.reloadFirstPage();
  }

  clearUser() {
    this.filter.userId = null;
    this.userFilterName = '';
    this.reloadFirstPage();
  }

  filterByTrace(traceId: string | undefined) {
    if (!traceId) return;
    this.filter.traceId = traceId;
    this.drawerVisible = false;
    this.reloadFirstPage();
  }

  clearTrace() {
    this.filter.traceId = null;
    this.reloadFirstPage();
  }

  // Kart tıklaması: listeyi o duruma filtrele
  onKpiClick(kpi: KpiView) {
    if (!kpi.clickable) return;
    this.resetFilterValues();
    if (kpi.key === 'errors') this.filter.levels = ['Error', 'Fatal'];
    if (kpi.key === 'warnings') this.filter.levels = ['Warning'];
    if (kpi.key === 'failedLogins') this.filter.eventType = 'LoginFailed';
    this.reloadFirstPage();
  }

  // Olay listesinden tıklama
  onEventClick(eventType: string) {
    this.resetFilterValues();
    this.filter.eventType = eventType;
    this.reloadFirstPage();
  }

  // En yavaş uçtan tıklama: o adresi ara
  onSlowClick(path: string) {
    this.resetFilterValues();
    this.searchText = path;
    this.filter.search = path;
    this.reloadFirstPage();
  }

  get hasFilters(): boolean {
    const f = this.filter;
    return f.levels.length > 0 || !!f.eventType || !!f.search || !!f.userId || !!f.traceId || f.onlyEvents;
  }

  clearFilters() {
    this.resetFilterValues();
    this.reloadFirstPage();
  }

  private resetFilterValues() {
    this.filter.levels = [];
    this.filter.eventType = null;
    this.filter.search = '';
    this.filter.userId = null;
    this.filter.traceId = null;
    this.filter.onlyEvents = false;
    this.searchText = '';
    this.userFilterName = '';
  }

  private reloadFirstPage() {
    this.filter.page = 1;
    this.loadLogs();
  }

  // Sayfalama (PrimeNG paginator sayfayı 0'dan sayar)
  onPage(event: PaginatorState) {
    this.filter.page = (event.page ?? 0) + 1;
    this.filter.pageSize = event.rows ?? 25;
    this.loadLogs();
  }

  // Elasticsearch ilk 10.000 kayıttan ötesine sayfalamaz
  get pageableTotal(): number {
    return Math.min(this.total, 10_000);
  }

  // ---------------------------------------------------------------
  // OTOMATİK YENİLEME (30 saniyede bir, iskelet göstermeden)
  // ---------------------------------------------------------------
  toggleAutoRefresh() {
    if (this.autoRefresh) {
      this.refreshTimer = setInterval(() => this.loadAll(true), 30_000);
    } else {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  // ---------------------------------------------------------------
  // DETAY
  // ---------------------------------------------------------------
  openDetail(entry: LogEntryDto) {
    this.detailEntry = entry;
    this.detail = null;
    this.detailFields = [];
    this.detailError = null;
    this.drawerVisible = true;
    this.isDetailLoading = true;

    this.logService.getDetail(entry.index, entry.id).subscribe({
      next: result => {
        this.detail = result.data;
        this.detailFields = this.buildFields(result.data);
        this.detailError = this.buildError(result.data.source);
        this.isDetailLoading = false;
      },
      error: err => {
        this.isDetailLoading = false;
        this.swal.error('Detay yüklenemedi', err.error?.errors?.[0]?.errorMessage);
      }
    });
  }

  // Ham logu "alan: değer" satırlarına çevir (iç içe nesneler noktalı adlarla)
  private buildFields(d: LogDetailDto): FieldRow[] {
    const rows: FieldRow[] = [];

    const walk = (obj: any, prefix: string) => {
      for (const [key, value] of Object.entries(obj ?? {})) {
        const path = prefix ? `${prefix}.${key}` : key;
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          walk(value, path);
        } else {
          const text = Array.isArray(value) ? JSON.stringify(value) : String(value);
          rows.push({ key: path, value: text, userName: d.userNames[text] });
        }
      }
    };
    walk(d.source, '');

    // Önemli alanlar en üstte, gerisi alfabetik
    const first = ['@timestamp', 'log.level', 'message', 'labels.EventType'];
    return rows.sort((a, b) => {
      const ia = first.indexOf(a.key), ib = first.indexOf(b.key);
      if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      return a.key.localeCompare(b.key);
    });
  }

  // Hata bilgileri (varsa)
  private buildError(source: any): ErrorView | null {
    const type = this.getPath(source, 'error.type');
    const message = this.getPath(source, 'error.message');
    const stack = this.getPath(source, 'error.stack_trace');
    return type || message || stack ? { type, message, stack } : null;
  }

  // "error.stack_trace" gibi yolu bul (iç içe ya da noktalı düz anahtar)
  private getPath(obj: any, path: string): string | undefined {
    if (!obj || typeof obj !== 'object') return undefined;
    if (obj[path] !== undefined) return String(obj[path]);
    const dot = path.indexOf('.');
    if (dot < 0) return undefined;
    return this.getPath(obj[path.slice(0, dot)], path.slice(dot + 1));
  }

  async copy(text: string | undefined, label = 'Kopyalandı') {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      this.swal.success(label);
    } catch {
      this.swal.error('Kopyalanamadı');
    }
  }

  copyJson() {
    if (this.detail) this.copy(JSON.stringify(this.detail.source, null, 2), 'Log JSON olarak kopyalandı');
  }

  // ---------------------------------------------------------------
  // GÖRÜNÜM YARDIMCILARI
  // ---------------------------------------------------------------
  levelLabel(level: string): string { return LEVEL_META[level]?.label ?? level; }
  levelTone(level: string): string { return LEVEL_META[level]?.tone ?? 'muted'; }
  eventLabel(type: string | undefined): string { return type ? (EVENT_META[type]?.label ?? type) : ''; }
  eventIcon(type: string | undefined): string { return type ? (EVENT_META[type]?.icon ?? 'pi pi-bolt') : ''; }
  eventTone(type: string | undefined): string { return type ? (EVENT_META[type]?.tone ?? 'info') : ''; }

  statusTone(code: number | undefined): string {
    if (!code) return 'muted';
    if (code >= 500) return 'danger';
    if (code >= 400) return 'warn';
    return 'success';
  }

  trackById(_: number, item: { id: string }) { return item.id; }
  trackByName(_: number, item: { name: string }) { return item.name; }
  trackByPath(_: number, item: { path: string }) { return item.path; }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (this.refreshTimer) clearInterval(this.refreshTimer);
  }
}
