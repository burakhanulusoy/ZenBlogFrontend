import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { UserService } from '../../_services/user-service';
import { AuthService } from '../../_services/auth-service';
import { SweetAlert } from '../../_services/sweet-alert';
import { ApiError } from '../../_models/result';
import { MyProfileDto, ROLE_LABELS } from '../../_models/user';

// Formda düzenlenen alanlar (hepsi yazı; boş = '')
interface ProfileForm {
  name: string;
  surname: string;
  userName: string;
  phoneNumber: string;
  location: string;
  description: string;
  instagramUrl: string;
  twitterUrl: string;
  linkedlnUrl: string;
  facebookUrl: string;
}

// =====================================================================
// PROFİLİM (ortak sayfa: admin, writer, user)
// Kişi SADECE kendi bilgilerini görür ve düzenler (backend kimliği token'dan buluyor).
// Kaydetmeden önce şifre onayı. E-posta değiştirilemez.
// "Hesabımı kapat" sadece canCloseAccount true ise (Admin'de görünmez).
// =====================================================================
@Component({
  selector: 'app-profile',
  standalone: false,
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile implements OnInit, OnDestroy {

  constructor(private userService: UserService,
              private authService: AuthService,
              private swal: SweetAlert) {}

  profile: MyProfileDto | null = null;
  isLoading = true;
  errorMessage = '';

  // Formun verisi + ilk hali ("değişiklik var mı?" karşılaştırması için)
  form: ProfileForm = this.emptyForm();
  private original: ProfileForm = this.emptyForm();

  // API alan hataları: [{ propertyName: "UserName", errorMessage: "..." }]
  errors: ApiError[] = [];

  // ---------------------------------------------------------------
  // FOTOĞRAF
  // ---------------------------------------------------------------
  imageFile: File | null = null;   // yeni seçilen
  imagePreview = '';               // yeni seçilenin geçici adresi (blob:)
  removeImage = false;             // "fotoğrafı kaldır" dendi mi?
  imageError = '';

  readonly maxImageSize = 5 * 1024 * 1024;   // 5 MB (backend ImageRules ile aynı)
  readonly imageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  readonly imageAccept = this.imageExtensions.join(',');
  readonly maxDescription = 500;

  // ---------------------------------------------------------------
  // ŞİFRE ONAY PENCERESİ (kaydet)
  // ---------------------------------------------------------------
  passwordDialogVisible = false;
  currentPassword = '';
  passwordError = '';
  isSaving = false;

  // ---------------------------------------------------------------
  // HESABIMI KAPAT PENCERESİ
  // closeStep: 'confirm' → bilgi + şifre, 'done' → "30 gün" ekranı
  // ---------------------------------------------------------------
  closeDialogVisible = false;
  closeStep: 'confirm' | 'done' = 'confirm';
  closePassword = '';
  closeConfirmed = false;
  closeError = '';
  isClosing = false;
  closeDeadline = '';

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile() {
    this.isLoading = true;
    this.errorMessage = '';

    this.userService.getMe().subscribe({
      next: result => {
        this.profile = result.data;
        this.fillForm(result.data);
        this.isLoading = false;
      },
      error: err => {
        this.isLoading = false;
        this.errorMessage = err.error?.errors?.[0]?.errorMessage ?? "Profil yüklenemedi.";
      }
    });
  }

  private emptyForm(): ProfileForm {
    return {
      name: '', surname: '', userName: '', phoneNumber: '', location: '', description: '',
      instagramUrl: '', twitterUrl: '', linkedlnUrl: '', facebookUrl: ''
    };
  }

  // API'den geleni forma koy (null → '') ve "ilk hal" olarak sakla
  private fillForm(p: MyProfileDto) {
    this.form = {
      name: p.name ?? '',
      surname: p.surname ?? '',
      userName: p.userName ?? '',
      phoneNumber: p.phoneNumber ?? '',
      location: p.location ?? '',
      description: p.description ?? '',
      instagramUrl: p.instagramUrl ?? '',
      twitterUrl: p.twitterUrl ?? '',
      linkedlnUrl: p.linkedlnUrl ?? '',
      facebookUrl: p.facebookUrl ?? ''
    };
    this.original = { ...this.form };   // kopya (ikisi aynı nesne olmasın)
    this.clearImageSelection();
    this.removeImage = false;
    this.errors = [];
  }

  // ---------------------------------------------------------------
  // GÖRÜNÜM
  // ---------------------------------------------------------------
  get fullName(): string {
    return `${this.form.name} ${this.form.surname}`.trim() || this.form.userName || 'İsimsiz';
  }

  get initials(): string {
    return this.fullName.split(' ').filter(p => p).map(p => p[0].toLocaleUpperCase('tr')).slice(0, 2).join('');
  }

  // Ekranda görünen fotoğraf: kaldırıldıysa yok, yeni seçildiyse önizleme, yoksa mevcut
  get displayImage(): string {
    if (this.removeImage) return '';
    return this.imagePreview || this.profile?.imageUrl || '';
  }

  get roleLabels(): string[] {
    return (this.profile?.roles ?? []).map(r => ROLE_LABELS[r] ?? r);
  }

  // Bir şey değişti mi? (alt çubuk ve Kaydet butonu buna göre)
  // JSON.stringify: iki nesneyi yazıya çevirip karşılaştırmanın kısa yolu
  get hasChanges(): boolean {
    return JSON.stringify(this.form) !== JSON.stringify(this.original)
        || !!this.imageFile
        || this.removeImage;
  }

  // Bir alanın API hatası
  fieldError(field: string): string | undefined {
    return this.errors.find(e => e.propertyName === field || e.propertyName?.startsWith(field + '.'))?.errorMessage;
  }

  // ---------------------------------------------------------------
  // FOTOĞRAF SEÇ / KALDIR
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
    this.imagePreview = URL.createObjectURL(file);   // yüklemeden önizleme
    this.removeImage = false;
  }

  // Yeni seçilmiş fotoğraf varsa onu iptal et; yoksa mevcut fotoğrafı kaldır
  removePhoto(input: HTMLInputElement) {
    if (this.imageFile) {
      this.clearImageSelection();
    } else {
      this.removeImage = true;
    }
    this.imageError = '';
    input.value = '';
  }

  undoRemovePhoto() {
    this.removeImage = false;
  }

  private clearImageSelection() {
    if (this.imagePreview) URL.revokeObjectURL(this.imagePreview);
    this.imagePreview = '';
    this.imageFile = null;
  }

  // "Vazgeç": formu ilk haline döndür
  resetForm(input?: HTMLInputElement) {
    this.form = { ...this.original };
    this.clearImageSelection();
    this.removeImage = false;
    this.imageError = '';
    this.errors = [];
    if (input) input.value = '';
  }

  // ---------------------------------------------------------------
  // KAYDET → şifre penceresi → API
  // ---------------------------------------------------------------
  openSaveDialog(profileForm: NgForm) {
    if (profileForm.invalid) {
      profileForm.control.markAllAsTouched();
      this.swal.error("Eksik alanlar var", "Kırmızı işaretli alanları doldur.");
      return;
    }

    this.currentPassword = '';
    this.passwordError = '';
    this.passwordDialogVisible = true;
  }

  confirmSave() {
    if (!this.currentPassword) return;

    this.isSaving = true;
    this.passwordError = '';

    // Backend'deki UpdateMyProfileCommand property adları
    const formData = new FormData();
    formData.append('Name', this.form.name);
    formData.append('Surname', this.form.surname);
    formData.append('UserName', this.form.userName);
    formData.append('PhoneNumber', this.form.phoneNumber);
    formData.append('Location', this.form.location);
    formData.append('Description', this.form.description);
    formData.append('InstagramUrl', this.form.instagramUrl);
    formData.append('TwitterUrl', this.form.twitterUrl);
    formData.append('LinkedlnUrl', this.form.linkedlnUrl);
    formData.append('FacebookUrl', this.form.facebookUrl);
    formData.append('RemoveImage', String(this.removeImage));   // "true" / "false"
    formData.append('CurrentPassword', this.currentPassword);
    if (this.imageFile) {
      formData.append('Image', this.imageFile, this.imageFile.name);
    }

    this.userService.updateMe(formData).subscribe({
      next: result => {
        this.isSaving = false;
        this.passwordDialogVisible = false;

        // Yeni token'ı sakla → layout sağ üstteki adı kendiliğinden yeniler
        this.authService.setToken(result.data.token);

        this.swal.success('Profilin güncellendi');
        this.loadProfile();
      },
      error: err => {
        this.isSaving = false;
        const errors: ApiError[] = err.error?.errors ?? [];

        if (err.status === 400 && errors.length > 0) {
          // Şifreyle ilgili (ya da alana bağlı olmayan) hata → pencerede göster
          const passwordRelated = errors.find(e =>
            !e.propertyName || e.propertyName === 'CurrentPassword' || e.propertyName === 'NoPassword');

          if (passwordRelated) {
            this.passwordError = passwordRelated.errorMessage;
            return;
          }

          // Alan hatası (örn. kullanıcı adı alınmış) → pencereyi kapat, alanın altında göster
          this.passwordDialogVisible = false;
          this.errors = errors;
          this.swal.error("Formda düzeltilmesi gereken alanlar var");
        } else {
          this.swal.error("Profil kaydedilemedi", err.error?.errorMessage ?? `Durum kodu: ${err.status}`);
        }
      }
    });
  }

  // ---------------------------------------------------------------
  // HESABIMI KAPAT
  // ---------------------------------------------------------------
  openCloseDialog() {
    this.closeStep = 'confirm';
    this.closePassword = '';
    this.closeConfirmed = false;
    this.closeError = '';
    this.closeDialogVisible = true;
  }

  get closeFormValid(): boolean {
    return this.closeConfirmed && !!this.closePassword;
  }

  confirmClose() {
    if (!this.closeFormValid) return;

    this.isClosing = true;
    this.closeError = '';

    this.userService.closeMe(this.closePassword).subscribe({
      next: result => {
        this.isClosing = false;
        this.closeDeadline = result.data.deletionDeadline;
        this.closeStep = 'done';   // "30 gün" ekranına geç
      },
      error: err => {
        this.isClosing = false;
        this.closeError = err.error?.errors?.[0]?.errorMessage ?? "Hesap kapatılamadı.";
      }
    });
  }

  // Kapanış ekranından çıkınca: token artık geçersiz → çıkış yap
  finishClose() {
    this.closeDialogVisible = false;
    this.authService.logout();
  }

  // Pencere başka bir yolla kapanırsa (Esc gibi) ve hesap kapatıldıysa yine çıkış yap
  onCloseDialogHide() {
    if (this.closeStep === 'done') {
      this.authService.logout();
    }
  }

  ngOnDestroy(): void {
    this.clearImageSelection();
  }
}
