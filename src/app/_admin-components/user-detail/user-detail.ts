import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../_services/user-service';
import { AuthService } from '../../_services/auth-service';
import { SweetAlert } from '../../_services/sweet-alert';
import { ApiError } from '../../_models/result';
import { AccountStatus, ROLE_LABELS, STATUS_LABELS, UserDetailDto, UserRecentBlogDto } from '../../_models/user';
import { RoleService } from '../../_services/role-service';
import { RoleDto } from '../../_models/role';

// =====================================================================
// KULLANICI DETAYI (sadece Admin)
// Bilgiler, istatistikler, son bloglar, bloke geçmişi + Bloke et / Blokeyi kaldır.
// Düzenleme YOK: herkes kendi bilgisini sadece Profilim'den değiştirir.
// =====================================================================
@Component({
  selector: 'app-user-detail',
  standalone: false,
  templateUrl: './user-detail.html',
  styleUrl: './user-detail.css'
})
export class UserDetail implements OnInit {

    constructor(private userService: UserService,
              private roleService: RoleService,      // YENİ
              private authService: AuthService,
              private swal: SweetAlert,
              private route: ActivatedRoute,
              private router: Router) {}

  user: UserDetailDto | null = null;
  isLoading = true;
  errorMessage = '';

  private currentUserId = '';

  // Backend'deki kurallarla aynı (kullanıcı boşuna beklemesin diye önden kontrol)
  readonly minBlockReason = 20;
  readonly minUnblockReason = 10;
  readonly maxReason = 1000;
  readonly maxEvidenceSize = 10 * 1024 * 1024;   // 10 MB
  readonly evidenceExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
  readonly evidenceAccept = this.evidenceExtensions.join(',');

  // ---------------------------------------------------------------
  // BLOKE PENCERESİ
  // ---------------------------------------------------------------
  blockDialogVisible = false;
  blockReason = '';
  evidenceFile: File | null = null;
  evidenceError = '';
  blockConfirmed = false;   // "Sonuçlarını anladım" kutusu
  blockErrors: ApiError[] = [];
  isBlocking = false;

  // ---------------------------------------------------------------
  // BLOKE KALDIRMA PENCERESİ
  // ---------------------------------------------------------------
  unblockDialogVisible = false;
  unblockReason = '';
  unblockErrors: ApiError[] = [];
  isUnblocking = false;

    // ---------------------------------------------------------------
  // YENİ: ROLLER
  // ---------------------------------------------------------------
  allRoles: RoleDto[] = [];
  selectedRoleIds: string[] = [];          // kutucuklarda işaretli olanlar
  private originalRoleIds: string[] = [];  // kullanıcının şu anki rolleri (karşılaştırma için)
  isSavingRoles = false;

  // Admin rolü verilirken açılan şifre penceresi
  rolePasswordDialogVisible = false;
  rolePassword = '';
  rolePasswordError = '';


   ngOnInit(): void {
    this.currentUserId = this.authService.getUserId();
    this.loadRoles();   // YENİ
    this.loadUser();
  }

  // YENİ: Bütün roller (kutucuklar için)
  loadRoles() {
    this.roleService.getAll().subscribe({
      next: result => {
        this.allRoles = (result.data ?? []).sort((a, b) =>
          Number(b.isSystem) - Number(a.isSystem) || a.name.localeCompare(b.name));
        this.syncRoleSelection();
      },
      error: () => this.swal.error('Roller yüklenemedi')
    });
  }

  // YENİ: Kullanıcının rol adlarını → rol Id'lerine çevir (iki istek de bitince çalışır)
  private syncRoleSelection() {
    if (!this.user || this.allRoles.length === 0) return;
    this.originalRoleIds = this.allRoles.filter(r => this.user.roles.includes(r.name)).map(r => r.id);
    this.selectedRoleIds = [...this.originalRoleIds];
  }



  loadUser() {
    const id = this.route.snapshot.paramMap.get('id');
    this.isLoading = true;
    this.errorMessage = '';

    this.userService.getById(id).subscribe({
      next: result => {
        this.user = result.data;
                this.syncRoleSelection();   // YENİ
        this.isLoading = false;
      },
      error: err => {
        this.isLoading = false;
        this.errorMessage = err.status === 404
          ? "Kullanıcı bulunamadı."
          : err.error?.errors?.[0]?.errorMessage ?? "Kullanıcı yüklenemedi.";
      }
    });
  }

  // ---------------------------------------------------------------
  // DURUM BİLGİLERİ
  // ---------------------------------------------------------------
  get fullName(): string {
    return `${this.user?.name ?? ''} ${this.user?.surname ?? ''}`.trim() || this.user?.userName || 'İsimsiz';
  }

  get initials(): string {
    return this.fullName.split(' ').filter(p => p).map(p => p[0].toLocaleUpperCase('tr')).slice(0, 2).join('');
  }

  get isSelf(): boolean {
    return this.user?.id === this.currentUserId;
  }

  get isAdminUser(): boolean {
    return this.user?.roles.includes('Admin') ?? false;
  }

  // Bloke edilebilir mi? Bloke değil + kendisi değil + yönetici değil (backend'deki kuralların aynısı)
  get canBlock(): boolean {
    return !!this.user && this.user.status !== 'Blocked' && !this.isSelf && !this.isAdminUser;
  }

  get canUnblock(): boolean {
    return this.user?.status === 'Blocked';
  }

  // Bloke butonu neden yok? (kullanıcıya açıklama)
  get blockDisabledReason(): string {
    if (this.isSelf) return 'Kendi hesabını bloke edemezsin.';
    if (this.isAdminUser) return 'Yönetici hesapları bloke edilemez. Önce Admin rolünün kaldırılması gerekir.';
    return '';
  }

  // Sosyal medya bağlantıları (sadece doluysa)
  get socialLinks(): { icon: string; label: string; url: string }[] {
    if (!this.user) return [];
    return [
      { icon: 'pi pi-instagram', label: 'Instagram', url: this.user.instagramUrl },
      { icon: 'pi pi-twitter', label: 'X (Twitter)', url: this.user.twitterUrl },
      { icon: 'pi pi-linkedin', label: 'LinkedIn', url: this.user.linkedlnUrl },
      { icon: 'pi pi-facebook', label: 'Facebook', url: this.user.facebookUrl }
    ].filter(link => !!link.url);
  }

  statusLabel(status: AccountStatus): string {
    return STATUS_LABELS[status] ?? status;
  }

  roleLabel(role: string): string {
    return ROLE_LABELS[role] ?? role;
  }

  isPdf(url: string): boolean {
    return url?.toLowerCase().endsWith('.pdf');
  }

  // ---------------------------------------------------------------
  // BLOKE ET
  // ---------------------------------------------------------------
  openBlockDialog() {
    this.blockReason = '';
    this.evidenceFile = null;
    this.evidenceError = '';
    this.blockConfirmed = false;
    this.blockErrors = [];
    this.blockDialogVisible = true;
  }

  onEvidenceSelected(event: Event, input: HTMLInputElement) {
    this.evidenceError = '';
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!this.evidenceExtensions.includes(extension)) {
      this.evidenceError = `Sadece ${this.evidenceExtensions.join(', ')} dosyaları yüklenebilir.`;
      input.value = '';
      return;
    }

    if (file.size > this.maxEvidenceSize) {
      this.evidenceError = "Kanıt dosyası en fazla 10 MB olabilir.";
      input.value = '';
      return;
    }

    this.evidenceFile = file;
  }

  removeEvidence(input: HTMLInputElement) {
    this.evidenceFile = null;
    this.evidenceError = '';
    input.value = '';
  }

  // Dosya boyutu: 1536000 → "1,5 MB"
  formatSize(bytes: number): string {
    return bytes >= 1024 * 1024
      ? `${(bytes / (1024 * 1024)).toLocaleString('tr-TR', { maximumFractionDigits: 1 })} MB`
      : `${Math.ceil(bytes / 1024)} KB`;
  }

  get blockFormValid(): boolean {
    return this.blockReason.trim().length >= this.minBlockReason && !!this.evidenceFile && this.blockConfirmed;
  }

  // Bir alanın API hatası (Evidence.Length gibi alt adları da yakalar)
  apiError(errors: ApiError[], field: string): string | undefined {
    return errors.find(e => e.propertyName === field || e.propertyName?.startsWith(field + '.'))?.errorMessage;
  }

  // Alana bağlı olmayan API hataları ("Yönetici hesapları bloke edilemez" gibi)
  generalErrors(errors: ApiError[], fields: string[]): ApiError[] {
    return errors.filter(e => !fields.some(f => e.propertyName === f || e.propertyName?.startsWith(f + '.')));
  }

  submitBlock() {
    if (!this.blockFormValid || !this.user) return;

    this.isBlocking = true;
    this.blockErrors = [];

    const formData = new FormData();
    formData.append('Reason', this.blockReason.trim());
    formData.append('Evidence', this.evidenceFile, this.evidenceFile.name);

    this.userService.block(this.user.id, formData).subscribe({
      next: () => {
        this.isBlocking = false;
        this.blockDialogVisible = false;
        this.swal.success('Kullanıcı bloke edildi', 'Kullanıcıya gerekçeli bilgilendirme e-postası gönderildi.');
        this.loadUser();
      },
      error: err => {
        this.isBlocking = false;
        if (err.status === 400 && err.error?.errors) {
          this.blockErrors = err.error.errors;   // pencere açık kalır, hatalar içinde görünür
        } else {
          this.swal.error('Bloke edilemedi', err.error?.errorMessage ?? `Durum kodu: ${err.status}`);
        }
      }
    });
  }

  // ---------------------------------------------------------------
  // BLOKEYİ KALDIR
  // ---------------------------------------------------------------
  openUnblockDialog() {
    this.unblockReason = '';
    this.unblockErrors = [];
    this.unblockDialogVisible = true;
  }

  get unblockFormValid(): boolean {
    return this.unblockReason.trim().length >= this.minUnblockReason;
  }

  submitUnblock() {
    if (!this.unblockFormValid || !this.user) return;

    this.isUnblocking = true;
    this.unblockErrors = [];

    this.userService.unblock(this.user.id, this.unblockReason.trim()).subscribe({
      next: () => {
        this.isUnblocking = false;
        this.unblockDialogVisible = false;
        this.swal.success('Bloke kaldırıldı', 'Kullanıcının içerikleri yeniden yayında.');
        this.loadUser();
      },
      error: err => {
        this.isUnblocking = false;
        if (err.status === 400 && err.error?.errors) {
          this.unblockErrors = err.error.errors;
        } else {
          this.swal.error('Bloke kaldırılamadı', err.error?.errorMessage ?? `Durum kodu: ${err.status}`);
        }
      }
    });
  }

  // ---------------------------------------------------------------
  // GEZİNME
  // ---------------------------------------------------------------
  goBack() {
    this.router.navigate(['users'], { relativeTo: this.route.parent });
  }

  openBlog(blog: UserRecentBlogDto) {
    this.router.navigate(['blogs', blog.id], { relativeTo: this.route.parent });
  }


  // ---------------------------------------------------------------
  // YENİ: ROL ATAMA
  // ---------------------------------------------------------------
  isRoleSelected(role: RoleDto): boolean {
    return this.selectedRoleIds.includes(role.id);
  }

  // Değiştirilemeyen kutucuklar:
  //   User → herkeste kalır
  //   Admin → kendi hesabındaysan kendi yönetici rolünü alamazsın
  isRoleLocked(role: RoleDto): boolean {
    return role.name === 'User' || (role.name === 'Admin' && this.isSelf);
  }

  roleLockReason(role: RoleDto): string {
    if (role.name === 'User') return 'Temel rol, herkeste bulunur.';
    if (role.name === 'Admin' && this.isSelf) return 'Kendi yönetici rolünü kaldıramazsın.';
    return '';
  }

  toggleRole(role: RoleDto) {
    if (this.isRoleLocked(role)) return;
    this.selectedRoleIds = this.isRoleSelected(role)
      ? this.selectedRoleIds.filter(id => id !== role.id)
      : [...this.selectedRoleIds, role.id];
  }

  // Değişiklik var mı? (sıralamadan bağımsız karşılaştırma)
  get rolesChanged(): boolean {
    const a = [...this.selectedRoleIds].sort().join();
    const b = [...this.originalRoleIds].sort().join();
    return a !== b;
  }

  resetRoles() {
    this.selectedRoleIds = [...this.originalRoleIds];
  }

  // Admin rolü YENİ mi veriliyor?
  private get isGrantingAdmin(): boolean {
    const admin = this.allRoles.find(r => r.name === 'Admin');
    return !!admin && this.selectedRoleIds.includes(admin.id) && !this.originalRoleIds.includes(admin.id);
  }

  async saveRoles() {
    if (!this.rolesChanged || !this.user) return;

    // Admin veriliyorsa → şifre penceresi
    if (this.isGrantingAdmin) {
      this.rolePassword = '';
      this.rolePasswordError = '';
      this.rolePasswordDialogVisible = true;
      return;
    }

    // Diğer değişiklikler → onay
    const confirmed = await this.swal.confirm({
      title: 'Roller güncellensin mi?',
      text: this.isSelf
        ? 'Kendi rollerini değiştiriyorsun. Kaydedince oturumun kapanacak, yeniden giriş yapman gerekecek.'
        : 'Kullanıcının açık oturumu kapanacak ve bilgilendirme e-postası gönderilecek.',
      confirmText: 'Evet, güncelle'
    });
    if (!confirmed) return;

    this.assignRoles(null);
  }

  confirmRolePassword() {
    if (!this.rolePassword) return;
    this.assignRoles(this.rolePassword);
  }

  private assignRoles(adminPassword: string | null) {
    this.isSavingRoles = true;
    this.rolePasswordError = '';

    this.roleService.assign(this.user.id, this.selectedRoleIds, adminPassword).subscribe({
      next: () => {
        this.isSavingRoles = false;
        this.rolePasswordDialogVisible = false;
        this.swal.success('Roller güncellendi', 'Kullanıcının oturumu kapatıldı.');
        this.loadUser();
        this.loadRoles();   // rol başına kullanıcı sayıları da değişti
      },
      error: err => {
        this.isSavingRoles = false;
        const errors: ApiError[] = err.error?.errors ?? [];

        // Şifre hatası → pencerede göster
        const passwordError = errors.find(e => e.propertyName === 'AdminPassword');
        if (passwordError && this.rolePasswordDialogVisible) {
          this.rolePasswordError = passwordError.errorMessage;
          return;
        }

        this.rolePasswordDialogVisible = false;
        this.swal.error('Roller güncellenemedi', errors[0]?.errorMessage ?? err.error?.errorMessage);
        this.resetRoles();
      }
    });
  }

  // Rol adının Türkçesi (geçmişte de kullanılıyor)
  roleName(name: string): string {
    return ROLE_LABELS[name] ?? name;
  }

}
