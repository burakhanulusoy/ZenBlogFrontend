import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { SocialMediaService } from '../../_services/social-media-service';
import { SweetAlert } from '../../_services/sweet-alert';
import { ApiError } from '../../_models/result';
import { SocialMediaDto } from '../../_models/site-content';

// =====================================================================
// SOSYAL MEDYA (sadece Admin, Site içeriği)
// Eklenen BÜTÜN hesaplar sitede ikon olarak görünür.
// Ekle/düzenle tek pencerede; ikon resmi form-data ile yükleniyor.
// =====================================================================
@Component({
  selector: 'app-social-medias',
  standalone: false,
  templateUrl: './social-medias.html',
  styleUrl: './social-medias.css'
})
export class SocialMedias implements OnInit, OnDestroy {

  constructor(private socialMediaService: SocialMediaService,
              private swal: SweetAlert) {}

  items: SocialMediaDto[] = [];
  isLoading = true;
  errorMessage = '';

  // PENCERE
  dialogVisible = false;
  isEditMode = false;
  isSaving = false;
  submitted = false;
  form = { id: '', title: '', url: '' };
  errors: ApiError[] = [];

  // İKON
  iconFile: File | null = null;
  iconPreview = '';        // yeni seçilenin geçici adresi (blob:)
  currentIcon = '';        // düzenlemede mevcut ikon
  iconError = '';
  readonly maxIconSize = 5 * 1024 * 1024;
  readonly iconExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  readonly iconAccept = this.iconExtensions.join(',');

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.isLoading = true;
    this.errorMessage = '';

    this.socialMediaService.getAll().subscribe({
      next: result => {
        this.items = result.data ?? [];
        this.isLoading = false;
      },
      error: err => {
        this.isLoading = false;
        this.errorMessage = err.error?.errors?.[0]?.errorMessage ?? "Sosyal medya hesapları yüklenemedi.";
      }
    });
  }

  // "https://www.instagram.com/zenblog" → "instagram.com"
  host(url: string): string {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return url;
    }
  }

  // ---------------------------------------------------------------
  // PENCERE
  // ---------------------------------------------------------------
  openCreate() {
    this.isEditMode = false;
    this.form = { id: '', title: '', url: '' };
    this.currentIcon = '';
    this.resetDialogState();
    this.dialogVisible = true;
  }

  openEdit(item: SocialMediaDto) {
    this.isEditMode = true;
    this.form = { id: item.id, title: item.title, url: item.url };
    this.currentIcon = item.icon;
    this.resetDialogState();
    this.dialogVisible = true;
  }

  private resetDialogState() {
    this.clearIconSelection();
    this.iconError = '';
    this.errors = [];
    this.submitted = false;
  }

  // Pencerede görünen ikon: yeni seçilen > mevcut
  get displayIcon(): string {
    return this.iconPreview || this.currentIcon;
  }

  // Yeni hesapta ikon zorunlu
  get iconMissing(): boolean {
    return !this.isEditMode && !this.iconFile;
  }

  onIconSelected(event: Event, input: HTMLInputElement) {
    this.iconError = '';
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!this.iconExtensions.includes(extension)) {
      this.iconError = `Sadece ${this.iconExtensions.join(', ')} dosyaları yüklenebilir.`;
      input.value = '';
      return;
    }
    if (file.size > this.maxIconSize) {
      this.iconError = "İkon en fazla 5 MB olabilir.";
      input.value = '';
      return;
    }

    this.clearIconSelection();
    this.iconFile = file;
    this.iconPreview = URL.createObjectURL(file);
  }

  removeIcon(input: HTMLInputElement) {
    this.clearIconSelection();
    input.value = '';
  }

  private clearIconSelection() {
    if (this.iconPreview) URL.revokeObjectURL(this.iconPreview);
    this.iconPreview = '';
    this.iconFile = null;
  }

  fieldError(field: string): string | undefined {
    return this.errors.find(e => e.propertyName === field || e.propertyName?.startsWith(field + '.'))?.errorMessage;
  }

  get otherErrors(): ApiError[] {
    const fields = ['Title', 'Url', 'Icon'];
    return this.errors.filter(e => !fields.some(f => e.propertyName === f || e.propertyName?.startsWith(f + '.')));
  }

  // ---------------------------------------------------------------
  // KAYDET
  // ---------------------------------------------------------------
  save(socialForm: NgForm) {
    this.submitted = true;
    if (socialForm.invalid || this.iconMissing) {
      socialForm.control.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.errors = [];

    // Backend'deki komut property adları
    const formData = new FormData();
    if (this.isEditMode) formData.append('Id', this.form.id);
    formData.append('Title', this.form.title.trim());
    formData.append('Url', this.form.url.trim());
    if (this.iconFile) formData.append('Icon', this.iconFile, this.iconFile.name);

    const request = this.isEditMode
      ? this.socialMediaService.update(formData)
      : this.socialMediaService.create(formData);

    request.subscribe({
      next: () => {
        this.isSaving = false;
        this.dialogVisible = false;
        this.swal.success(this.isEditMode ? 'Hesap güncellendi' : 'Hesap eklendi');
        this.load();
      },
      error: err => {
        this.isSaving = false;
        if (err.status === 400 && err.error?.errors) {
          this.errors = err.error.errors;
        } else {
          this.swal.error('Kaydedilemedi', err.error?.errorMessage ?? `Durum kodu: ${err.status}`);
        }
      }
    });
  }

  // ---------------------------------------------------------------
  // SİL
  // ---------------------------------------------------------------
  async deleteItem(item: SocialMediaDto) {
    const confirmed = await this.swal.confirm({
      title: 'Hesap silinsin mi?',
      text: `"${item.title}" sitedeki sosyal medya ikonlarından kaldırılacak.`,
      confirmText: 'Evet, sil',
      danger: true
    });
    if (!confirmed) return;

    this.socialMediaService.delete(item.id).subscribe({
      next: () => {
        this.swal.success('Hesap silindi');
        this.load();
      },
      error: err => this.swal.error('Silinemedi', err.error?.errors?.[0]?.errorMessage)
    });
  }

  ngOnDestroy(): void {
    this.clearIconSelection();
  }
}
