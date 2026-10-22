import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { WriterApplicationService } from '../../_services/writer-application-service';
import { CategoryService } from '../../_services/category-service';
import { SweetAlert } from '../../_services/sweet-alert';
import { ApiError } from '../../_models/result';
import { CategoryDto } from '../../_models/category';
import { APPLICATION_STATUS_LABELS, MyWriterApplicationDto, WriterApplicationStatus } from '../../_models/writer-application';

// =====================================================================
// YAZAR OL (sadece User paneli, piksel tasarım)
// Duruma göre üç görünüm:
//   - başvurabilir      → form
//   - bekleyen başvuru  → takip ekranı (Gönderildi → İnceleniyor → Sonuç)
//   - yakın zamanda ret → gerekçe + tekrar başvuru tarihi
// =====================================================================
@Component({
  selector: 'app-become-writer',
  standalone: false,
  templateUrl: './become-writer.html',
  styleUrl: './become-writer.css'
})
export class BecomeWriter implements OnInit {

  constructor(private applicationService: WriterApplicationService,
              private categoryService: CategoryService,
              private swal: SweetAlert) {}

  status: MyWriterApplicationDto | null = null;
  categories: CategoryDto[] = [];

  isLoading = true;
  errorMessage = '';

  // FORM
  selectedCategoryIds: string[] = [];
  form = { motivation: '', experience: '', sampleLinks: '', acceptedRules: false };
  errors: ApiError[] = [];
  isSubmitting = false;
  submitted = false;   // en az bir kez "Başvur"a basıldı mı (uyarıları göstermek için)

  // Backend'deki kurallarla aynı
  readonly maxTopics = 5;
  readonly minMotivation = 50;
  readonly maxMotivation = 2000;
  readonly maxOther = 1000;

  ngOnInit(): void {
    this.load();
  }

  // Başvuru durumu + kategoriler aynı anda (C#: Task.WhenAll)
  load() {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      status: this.applicationService.getMine(),
      categories: this.categoryService.getCategories()
    }).subscribe({
      next: result => {
        this.status = result.status.data;
        this.categories = result.categories.data ?? [];
        this.isLoading = false;
      },
      error: err => {
        this.isLoading = false;
        this.errorMessage = err.error?.errors?.[0]?.errorMessage ?? "Bilgiler yüklenemedi.";
      }
    });
  }

  // ---------------------------------------------------------------
  // GÖRÜNÜM DURUMLARI
  // ---------------------------------------------------------------
  get latestStatus(): WriterApplicationStatus | null {
    return this.status?.latest?.status ?? null;
  }

  // Bekleyen başvuru var mı (Beklemede ya da İnceleniyor)
  get isWaiting(): boolean {
    return this.latestStatus === 'Pending' || this.latestStatus === 'Reviewed';
  }

  // Reddedildi ve henüz tekrar başvuramaz
  get isRejectedCooldown(): boolean {
    return this.latestStatus === 'Rejected' && !this.status?.canApply;
  }

  statusLabel(status: WriterApplicationStatus): string {
    return APPLICATION_STATUS_LABELS[status] ?? status;
  }

  // Takip ekranı: kaçıncı adımdayız (1: gönderildi, 2: inceleniyor, 3: sonuç)
  get currentStep(): number {
    switch (this.latestStatus) {
      case 'Pending': return 1;
      case 'Reviewed': return 2;
      default: return 3;
    }
  }

  // ---------------------------------------------------------------
  // KONU SEÇİMİ (en fazla 5)
  // ---------------------------------------------------------------
  isSelected(category: CategoryDto): boolean {
    return this.selectedCategoryIds.includes(category.id);
  }

  toggleCategory(category: CategoryDto) {
    if (this.isSelected(category)) {
      this.selectedCategoryIds = this.selectedCategoryIds.filter(id => id !== category.id);
    } else if (this.selectedCategoryIds.length < this.maxTopics) {
      this.selectedCategoryIds = [...this.selectedCategoryIds, category.id];
    }
  }

  // ---------------------------------------------------------------
  // GÖNDER
  // ---------------------------------------------------------------
  get motivationLength(): number {
    return this.form.motivation.trim().length;
  }

  get canSubmit(): boolean {
    return this.selectedCategoryIds.length > 0
        && this.motivationLength >= this.minMotivation
        && this.form.acceptedRules
        && !this.isSubmitting;
  }

  fieldError(field: string): string | undefined {
    return this.errors.find(e => e.propertyName === field)?.errorMessage;
  }

  get generalErrors(): ApiError[] {
    const fields = ['CategoryIds', 'Motivation', 'Experience', 'SampleLinks', 'AcceptedRules'];
    return this.errors.filter(e => !fields.includes(e.propertyName));
  }

  submit() {
    this.submitted = true;
    if (!this.canSubmit) return;

    this.isSubmitting = true;
    this.errors = [];

    this.applicationService.submit({
      categoryIds: this.selectedCategoryIds,
      motivation: this.form.motivation.trim(),
      experience: this.form.experience.trim(),
      sampleLinks: this.form.sampleLinks.trim(),
      acceptedRules: this.form.acceptedRules
    }).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.swal.success('Başvurun alındı', 'Sonucu e-posta ile bildireceğiz.');
        this.load();   // takip ekranına geç
      },
      error: err => {
        this.isSubmitting = false;
        if (err.status === 400 && err.error?.errors) {
          this.errors = err.error.errors;
        } else {
          this.swal.error('Başvuru gönderilemedi', err.error?.errorMessage ?? `Durum kodu: ${err.status}`);
        }
      }
    });
  }
}
