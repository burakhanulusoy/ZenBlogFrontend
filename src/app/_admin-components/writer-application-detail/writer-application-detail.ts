import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { WriterApplicationService } from '../../_services/writer-application-service';
import { SweetAlert } from '../../_services/sweet-alert';
import { ApiError } from '../../_models/result';
import { APPLICATION_STATUS_LABELS, WriterApplicationDetailDto, WriterApplicationStatus } from '../../_models/writer-application';

// =====================================================================
// YAZARLIK BAŞVURUSU DETAYI (sadece Admin)
// Açılınca backend "okundu" işaretler. Onayla → Writer rolü, Reddet → gerekçe zorunlu.
// =====================================================================
@Component({
  selector: 'app-writer-application-detail',
  standalone: false,
  templateUrl: './writer-application-detail.html',
  styleUrl: './writer-application-detail.css'
})
export class WriterApplicationDetail implements OnInit {

  constructor(private applicationService: WriterApplicationService,
              private swal: SweetAlert,
              private route: ActivatedRoute,
              private router: Router) {}

  application: WriterApplicationDetailDto | null = null;
  isLoading = true;
  errorMessage = '';
  isApproving = false;

  // Reddet penceresi
  rejectDialogVisible = false;
  rejectReason = '';
  rejectErrors: ApiError[] = [];
  isRejecting = false;
  readonly minReason = 20;
  readonly maxReason = 1000;

  ngOnInit(): void {
    this.load();
  }

  load() {
    const id = this.route.snapshot.paramMap.get('id');
    this.isLoading = true;
    this.errorMessage = '';

    this.applicationService.getById(id).subscribe({
      next: result => {
        this.application = result.data;
        this.isLoading = false;
      },
      error: err => {
        this.isLoading = false;
        this.errorMessage = err.status === 404
          ? "Başvuru bulunamadı."
          : err.error?.errors?.[0]?.errorMessage ?? "Başvuru yüklenemedi.";
      }
    });
  }

  // Karar verilebilir mi? (Beklemede ya da İnceleniyor)
  get isOpen(): boolean {
    return this.application?.status === 'Pending' || this.application?.status === 'Reviewed';
  }

  statusLabel(status: WriterApplicationStatus): string {
    return APPLICATION_STATUS_LABELS[status] ?? status;
  }

  get initials(): string {
    return (this.application?.fullName ?? '').split(' ').filter(p => p)
      .map(p => p[0].toLocaleUpperCase('tr')).slice(0, 2).join('');
  }

  get topicList(): string[] {
    return this.application?.topics ? this.application.topics.split(',').map(t => t.trim()).filter(t => t) : [];
  }

  // Örnek bağlantılar: her satır ayrı; http ile başlayanlar tıklanabilir
  get sampleLines(): { text: string; isLink: boolean }[] {
    return (this.application?.sampleLinks ?? '')
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line)
      .map(line => ({ text: line, isLink: /^https?:\/\//i.test(line) }));
  }

  // ---------------------------------------------------------------
  // ONAYLA
  // ---------------------------------------------------------------
  async approve() {
    if (!this.application) return;

    const confirmed = await this.swal.confirm({
      title: 'Başvuru onaylansın mı?',
      text: `${this.application.fullName} yazar olacak. Açık oturumu kapanacak ve tebrik e-postası gönderilecek.`,
      confirmText: 'Evet, onayla'
    });
    if (!confirmed) return;

    this.isApproving = true;
    this.applicationService.approve(this.application.id).subscribe({
      next: () => {
        this.isApproving = false;
        this.swal.success('Başvuru onaylandı', 'Kullanıcı artık yazar.');
        this.load();
      },
      error: err => {
        this.isApproving = false;
        this.swal.error('Onaylanamadı', err.error?.errors?.[0]?.errorMessage);
      }
    });
  }

  // ---------------------------------------------------------------
  // REDDET
  // ---------------------------------------------------------------
  openRejectDialog() {
    this.rejectReason = '';
    this.rejectErrors = [];
    this.rejectDialogVisible = true;
  }

  get rejectValid(): boolean {
    return this.rejectReason.trim().length >= this.minReason;
  }

  get rejectError(): string | undefined {
    return this.rejectErrors[0]?.errorMessage;
  }

  submitReject() {
    if (!this.rejectValid || !this.application) return;

    this.isRejecting = true;
    this.rejectErrors = [];

    this.applicationService.reject(this.application.id, this.rejectReason.trim()).subscribe({
      next: () => {
        this.isRejecting = false;
        this.rejectDialogVisible = false;
        this.swal.success('Başvuru reddedildi', 'Kullanıcıya gerekçeli e-posta gönderildi.');
        this.load();
      },
      error: err => {
        this.isRejecting = false;
        if (err.status === 400 && err.error?.errors) {
          this.rejectErrors = err.error.errors;
        } else {
          this.swal.error('Reddedilemedi', err.error?.errorMessage ?? `Durum kodu: ${err.status}`);
        }
      }
    });
  }

  // ---------------------------------------------------------------
  // GEZİNME
  // ---------------------------------------------------------------
  goBack() {
    this.router.navigate(['writer-applications'], { relativeTo: this.route.parent });
  }

  openUser() {
    this.router.navigate(['users', this.application.userId], { relativeTo: this.route.parent });
  }
}
