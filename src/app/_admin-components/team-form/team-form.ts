import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { TeamService } from '../../_services/team-service';
import { SweetAlert } from '../../_services/sweet-alert';
import { ApiError } from '../../_models/result';
import { PLATFORM_LABELS, TeamPlatformDto, TeamSocialDto } from '../../_models/team';

// =====================================================================
// EKİP ÜYESİ FORMU (yeni + düzenle) · sadece Admin
//   /admin/teams/new        → üye bilgileri; kaydedince düzenleme sayfasına geçer
//   /admin/teams/edit/:id   → bilgiler + sosyal hesaplar
// Sosyal hesap eklemek için üyenin Id'si gerektiği için o bölüm sadece düzenlemede.
// =====================================================================
@Component({
  selector: 'app-team-form',
  standalone: false,
  templateUrl: './team-form.html',
  styleUrl: './team-form.css'
})
export class TeamForm implements OnInit, OnDestroy {

  constructor(private teamService: TeamService,
              private swal: SweetAlert,
              private route: ActivatedRoute,
              private router: Router) {}

  teamId: string | null = null;
  get isEditMode(): boolean { return !!this.teamId; }

  // ---------------------------------------------------------------
  // ÜYE BİLGİLERİ
  // ---------------------------------------------------------------
  model = { name: '', surname: '', title: '', description: '' };
  errors: ApiError[] = [];
  isLoading = false;
  isSaving = false;
  loadError = '';
  submitted = false;
  readonly maxDescription = 1000;

  // Fotoğraf
  imageFile: File | null = null;
  imagePreview = '';     // yeni seçilenin geçici adresi
  currentImage = '';     // düzenlemede mevcut fotoğraf
  imageError = '';
  readonly maxImageSize = 5 * 1024 * 1024;
  readonly imageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  readonly imageAccept = this.imageExtensions.join(',');

  // ---------------------------------------------------------------
  // SOSYAL HESAPLAR
  // ---------------------------------------------------------------
  socials: TeamSocialDto[] = [];
  platforms: TeamPlatformDto[] = [];

  // Yeni hesap satırı
  newSocial: { socialMediaName: string | null; url: string } = { socialMediaName: null, url: '' };
  newSocialError = '';
  isAddingSocial = false;

  // Satır içi düzenleme
  editingSocialId: string | null = null;
  editSocial = { socialMediaName: '', url: '' };
  editSocialError = '';
  isSavingSocial = false;

  ngOnInit(): void {
    this.teamId = this.route.snapshot.paramMap.get('id');
    this.loadPlatforms();
    if (this.isEditMode) this.loadTeam();
  }

  loadPlatforms() {
    this.teamService.getPlatforms().subscribe({
      next: result => this.platforms = result.data ?? [],
      error: () => this.swal.error('Platformlar yüklenemedi')
    });
  }

  loadTeam() {
    this.isLoading = true;
    this.loadError = '';

    this.teamService.getById(this.teamId).subscribe({
      next: result => {
        const t = result.data;
        this.model = { name: t.name, surname: t.surname, title: t.title, description: t.description };
        this.currentImage = t.image;
        this.socials = t.teamSocialMedias ?? [];
        this.isLoading = false;
      },
      error: err => {
        this.isLoading = false;
        this.loadError = err.status === 404 ? "Ekip üyesi bulunamadı." : (err.error?.errors?.[0]?.errorMessage ?? "Yüklenemedi.");
      }
    });
  }

  // Sadece sosyal hesapları yenile (form alanlarına dokunmadan)
  private reloadSocials() {
    this.teamService.getById(this.teamId).subscribe({
      next: result => this.socials = result.data.teamSocialMedias ?? []
    });
  }

  // ---------------------------------------------------------------
  // GÖRÜNÜM YARDIMCILARI
  // ---------------------------------------------------------------
  get displayImage(): string {
    return this.imagePreview || this.currentImage;
  }

  get previewName(): string {
    return `${this.model.name} ${this.model.surname}`.trim() || 'Ad Soyad';
  }

  platformLabel(name: string): string {
    return PLATFORM_LABELS[name] ?? name;
  }

  // Yeni ekleme listesi: üyede zaten olan platformlar çıkarılır
  get availablePlatforms(): TeamPlatformDto[] {
    const used = this.socials.map(s => s.socialMediaName);
    return this.platforms.filter(p => !used.includes(p.name));
  }

  // Düzenleme listesi: kendi platformu + kullanılmayanlar
  platformsForEdit(social: TeamSocialDto): TeamPlatformDto[] {
    const used = this.socials.filter(s => s.id !== social.id).map(s => s.socialMediaName);
    return this.platforms.filter(p => !used.includes(p.name));
  }

  fieldError(field: string): string | undefined {
    return this.errors.find(e => e.propertyName === field || e.propertyName?.startsWith(field + '.'))?.errorMessage;
  }

  get generalErrors(): ApiError[] {
    return this.errors.filter(e => !e.propertyName);
  }

  private isValidUrl(url: string): boolean {
    return /^https?:\/\/.+/i.test(url.trim());
  }

  // ---------------------------------------------------------------
  // FOTOĞRAF
  // ---------------------------------------------------------------
  onImageSelected(event: Event, input: HTMLInputElement) {
    this.imageError = '';
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!this.imageExtensions.includes(extension)) {
      this.imageError = `Sadece ${this.imageExtensions.join(', ')} dosyaları yüklenebilir.`;
      input.value = '';
      return;
    }
    if (file.size > this.maxImageSize) {
      this.imageError = "Fotoğraf en fazla 5 MB olabilir.";
      input.value = '';
      return;
    }

    this.clearImageSelection();
    this.imageFile = file;
    this.imagePreview = URL.createObjectURL(file);
  }

  removeImageSelection(input: HTMLInputElement) {
    this.clearImageSelection();
    input.value = '';
  }

  private clearImageSelection() {
    if (this.imagePreview) URL.revokeObjectURL(this.imagePreview);
    this.imagePreview = '';
    this.imageFile = null;
  }

  get imageMissing(): boolean {
    return !this.isEditMode && !this.imageFile;
  }

  // ---------------------------------------------------------------
  // ÜYEYİ KAYDET
  // ---------------------------------------------------------------
  save(teamForm: NgForm) {
    this.submitted = true;
    if (teamForm.invalid || this.imageMissing) {
      teamForm.control.markAllAsTouched();
      this.swal.error("Eksik alanlar var", "Kırmızı işaretli alanları doldur.");
      return;
    }

    this.isSaving = true;
    this.errors = [];

    const formData = new FormData();
    if (this.isEditMode) formData.append('Id', this.teamId);
    formData.append('Name', this.model.name.trim());
    formData.append('Surname', this.model.surname.trim());
    formData.append('Title', this.model.title.trim());
    formData.append('Description', this.model.description.trim());
    if (this.imageFile) formData.append('Image', this.imageFile, this.imageFile.name);

    if (this.isEditMode) {
      this.teamService.update(formData).subscribe({
        next: () => {
          this.isSaving = false;
          this.swal.success('Ekip üyesi güncellendi');
          this.clearImageSelection();
          this.loadTeam();
        },
        error: err => this.handleSaveError(err)
      });
    } else {
      this.teamService.create(formData).subscribe({
        next: result => {
          this.isSaving = false;
          this.swal.success('Üye eklendi', 'Şimdi sosyal hesaplarını ekleyebilirsin.');
          // Yeni üyenin düzenleme sayfasına geç (replaceUrl: Geri tuşu boş forma dönmesin)
          this.router.navigate(['teams', 'edit', result.data], { relativeTo: this.route.parent, replaceUrl: true });
        },
        error: err => this.handleSaveError(err)
      });
    }
  }

  private handleSaveError(err: any) {
    this.isSaving = false;
    if (err.status === 400 && err.error?.errors) {
      this.errors = err.error.errors;
      this.swal.error("Formda düzeltilmesi gereken alanlar var");
    } else {
      this.swal.error("Kaydedilemedi", err.error?.errorMessage ?? `Durum kodu: ${err.status}`);
    }
  }

  // ---------------------------------------------------------------
  // SOSYAL HESAP: EKLE
  // ---------------------------------------------------------------
  addSocial() {
    this.newSocialError = '';

    if (!this.newSocial.socialMediaName) {
      this.newSocialError = 'Bir platform seç.';
      return;
    }
    if (!this.isValidUrl(this.newSocial.url)) {
      this.newSocialError = 'Geçerli bir adres gir (https://...).';
      return;
    }

    this.isAddingSocial = true;
    this.teamService.addSocial(this.teamId, this.newSocial.socialMediaName, this.newSocial.url.trim()).subscribe({
      next: () => {
        this.isAddingSocial = false;
        this.newSocial = { socialMediaName: null, url: '' };
        this.swal.success('Sosyal hesap eklendi');
        this.reloadSocials();
      },
      error: err => {
        this.isAddingSocial = false;
        this.newSocialError = err.error?.errors?.[0]?.errorMessage ?? 'Eklenemedi.';
      }
    });
  }

  // ---------------------------------------------------------------
  // SOSYAL HESAP: SATIR İÇİ DÜZENLE
  // ---------------------------------------------------------------
  startEdit(social: TeamSocialDto) {
    this.editingSocialId = social.id;
    this.editSocial = { socialMediaName: social.socialMediaName, url: social.url };
    this.editSocialError = '';
  }

  cancelEdit() {
    this.editingSocialId = null;
    this.editSocialError = '';
  }

  saveEdit(social: TeamSocialDto) {
    this.editSocialError = '';
    if (!this.isValidUrl(this.editSocial.url)) {
      this.editSocialError = 'Geçerli bir adres gir (https://...).';
      return;
    }

    this.isSavingSocial = true;
    this.teamService.updateSocial(social.id, this.editSocial.socialMediaName, this.editSocial.url.trim()).subscribe({
      next: () => {
        this.isSavingSocial = false;
        this.editingSocialId = null;
        this.swal.success('Sosyal hesap güncellendi');
        this.reloadSocials();
      },
      error: err => {
        this.isSavingSocial = false;
        this.editSocialError = err.error?.errors?.[0]?.errorMessage ?? 'Güncellenemedi.';
      }
    });
  }

  // ---------------------------------------------------------------
  // SOSYAL HESAP: SİL
  // ---------------------------------------------------------------
  async deleteSocial(social: TeamSocialDto) {
    const confirmed = await this.swal.confirm({
      title: 'Sosyal hesap silinsin mi?',
      text: `${this.platformLabel(social.socialMediaName)} hesabı bu üyeden kaldırılacak.`,
      confirmText: 'Evet, sil',
      danger: true
    });
    if (!confirmed) return;

    this.teamService.deleteSocial(social.id).subscribe({
      next: () => {
        this.swal.success('Sosyal hesap silindi');
        this.reloadSocials();
      },
      error: err => this.swal.error('Silinemedi', err.error?.errors?.[0]?.errorMessage)
    });
  }

  goBack() {
    this.router.navigate(['teams'], { relativeTo: this.route.parent });
  }

  ngOnDestroy(): void {
    this.clearImageSelection();
  }
}
