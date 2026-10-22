import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { WriterApplicationService } from '../../_services/writer-application-service';
import { APPLICATION_STATUS_LABELS, WriterApplicationListItemDto, WriterApplicationStatus } from '../../_models/writer-application';

// Sekmeler: "open" = Beklemede + İnceleniyor (karar bekleyenler)
type Tab = 'open' | 'Approved' | 'Rejected' | 'all';

// =====================================================================
// YAZARLIK BAŞVURULARI (sadece Admin)
// Açılmamış (Beklemede) başvurular kalın + "Yeni" etiketli.
// =====================================================================
@Component({
  selector: 'app-writer-applications',
  standalone: false,
  templateUrl: './writer-applications.html',
  styleUrl: './writer-applications.css'
})
export class WriterApplications implements OnInit {

  constructor(private applicationService: WriterApplicationService,
              private router: Router,
              private route: ActivatedRoute) {}

  applications: WriterApplicationListItemDto[] = [];
  filtered: WriterApplicationListItemDto[] = [];
  tab: Tab = 'open';

  isLoading = true;
  errorMessage = '';

  readonly tabs: { value: Tab; label: string; icon: string }[] = [
    { value: 'open', label: 'Karar bekleyen', icon: 'pi pi-inbox' },
    { value: 'Approved', label: 'Onaylanan', icon: 'pi pi-check-circle' },
    { value: 'Rejected', label: 'Reddedilen', icon: 'pi pi-times-circle' },
    { value: 'all', label: 'Tümü', icon: 'pi pi-list' }
  ];

  counts: Record<Tab, number> = { open: 0, Approved: 0, Rejected: 0, all: 0 };

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.isLoading = true;
    this.errorMessage = '';

    this.applicationService.getAll().subscribe({
      next: result => {
        this.applications = result.data ?? [];
        this.counts = {
          open: this.applications.filter(a => this.isOpen(a.status)).length,
          Approved: this.applications.filter(a => a.status === 'Approved').length,
          Rejected: this.applications.filter(a => a.status === 'Rejected').length,
          all: this.applications.length
        };
        this.applyFilter();
        this.isLoading = false;
      },
      error: err => {
        this.isLoading = false;
        this.errorMessage = err.error?.errors?.[0]?.errorMessage ?? "Başvurular yüklenemedi.";
      }
    });
  }

  private isOpen(status: WriterApplicationStatus): boolean {
    return status === 'Pending' || status === 'Reviewed';
  }

  setTab(tab: Tab) {
    this.tab = tab;
    this.applyFilter();
  }

  private applyFilter() {
    this.filtered = this.applications.filter(a =>
      this.tab === 'all' ||
      (this.tab === 'open' ? this.isOpen(a.status) : a.status === this.tab));
  }

  open(application: WriterApplicationListItemDto) {
    this.router.navigate([application.id], { relativeTo: this.route });
  }

  statusLabel(status: WriterApplicationStatus): string {
    return APPLICATION_STATUS_LABELS[status] ?? status;
  }

  initials(app: WriterApplicationListItemDto): string {
    return app.fullName.split(' ').filter(p => p).map(p => p[0].toLocaleUpperCase('tr')).slice(0, 2).join('');
  }

  topicList(topics: string): string[] {
    return topics ? topics.split(',').map(t => t.trim()).filter(t => t) : [];
  }
}
