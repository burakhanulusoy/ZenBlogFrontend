import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../_services/auth-service';

declare const alertify: any;

@Component({
  selector: 'app-forgot-password',
  standalone: false,
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css'
})
export class ForgotPassword implements OnInit, OnDestroy {

  constructor(private authService: AuthService,
              private route: ActivatedRoute,
              private router: Router) {}

  // Sayfanın hangi adımda olduğu:
  //   'email' → 1. adım: e-posta gir, kod gönder
  //   'reset' → 2. adım: kod ve yeni şifre gir
  step: 'email' | 'reset' = 'email';

  email = '';
  code = '';
  newPassword = '';
  confirmPassword = '';

  showPassword = false;
  isLoading = false;
  errorMessage = '';
  errors: any[] = [];   // API'den gelen hata listesi (şifre kuralları vb.)

  countdown = 0;        // "kodu tekrar gönder" için kalan saniye
  private timer: any;

  ngOnInit(): void {
    // Login'den gelirken yazılmış e-posta varsa doldur: /forgot-password?email=...
    this.email = this.route.snapshot.queryParamMap.get('email') ?? '';
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  // ---------------------------------------------------------------
  // CANLI ŞİFRE KURALLARI (kayıt sayfasıyla aynı, Identity ayarlarıyla birebir)
  // ---------------------------------------------------------------
  get hasMinLength() { return this.newPassword.length >= 8; }
  get hasUpper()     { return /[A-Z]/.test(this.newPassword); }
  get hasLower()     { return /[a-z]/.test(this.newPassword); }
  get hasDigit()     { return /[0-9]/.test(this.newPassword); }
  get hasSpecial()   { return /[^A-Za-z0-9]/.test(this.newPassword); }

  get passwordValid() {
    return this.hasMinLength && this.hasUpper && this.hasLower && this.hasDigit && this.hasSpecial;
  }

  get passwordsMismatch() {
    return !!this.confirmPassword && this.confirmPassword !== this.newPassword;
  }

  // API'nin şifre hataları: validator "NewPassword", Identity "PasswordTooShort" gibi kodlar dönüyor
  get passwordErrors(): string[] {
    return this.errors
      .filter(e => e.propertyName === 'NewPassword' || e.propertyName.startsWith('Password'))
      .map(e => e.errorMessage);
  }

  // ---------------------------------------------------------------
  // 1. ADIM: KOD GÖNDER (ve "tekrar gönder")
  // ---------------------------------------------------------------
  sendCode() {

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.forgotPassword(this.email).subscribe({

      next: result => {
        this.isLoading = false;
        // API güvenlik gereği her zaman aynı genel mesajı dönüyor
        alertify.success(result.data?.message ?? "Kod gönderildi.");
        this.step = 'reset';      // 2. adıma geç
        this.startCountdown();
      },

      error: err => {
        this.isLoading = false;
        this.errorMessage = err.status === 0
          ? "Sunucuya ulaşılamadı. Lütfen daha sonra tekrar deneyin."
          : err.error?.errors?.[0]?.errorMessage ?? "Kod gönderilirken bir sorun oluştu.";
      }
    });
  }

  // ---------------------------------------------------------------
  // 2. ADIM: YENİ ŞİFREYİ BELİRLE
  // ---------------------------------------------------------------
  resetPassword() {

    this.isLoading = true;
    this.errorMessage = '';
    this.errors = [];

    this.authService.resetPassword(this.email, this.code, this.newPassword, this.confirmPassword).subscribe({

      next: result => {
        alertify.success("Şifren güncellendi!");
        // Login'e git: e-posta dolu gelsin, "şifren güncellendi" mesajı görünsün
        this.router.navigate(["/login"], { queryParams: { email: this.email, reset: true } });
      },

      error: err => {
        this.isLoading = false;

        if (err.status === 0) {
          this.errorMessage = "Sunucuya ulaşılamadı. Lütfen daha sonra tekrar deneyin.";
          return;
        }

        this.errors = err.error?.errors ?? [];

        // Şifre hataları şifre alanının altında; diğerleri (kod hatalı, çok fazla deneme...) üstte
        const nonPasswordError = this.errors.find(e =>
          !(e.propertyName === 'NewPassword' || e.propertyName.startsWith('Password')));

        if (nonPasswordError) {
          this.errorMessage = nonPasswordError.errorMessage;
        } else if (this.errors.length === 0) {
          this.errorMessage = "Şifre güncellenirken bir sorun oluştu.";
        }
      }
    });
  }

  // E-postayı değiştirmek isteyen kullanıcı için 1. adıma dön
  changeEmail() {
    this.step = 'email';
    this.code = '';
    this.errorMessage = '';
    this.errors = [];
  }

  // 60 saniyelik geri sayım (backend'deki dakikada 5 istek sınırına takılmamak için)
  private startCountdown(seconds = 60) {
    this.countdown = seconds;
    clearInterval(this.timer);

    this.timer = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(this.timer);
      }
    }, 1000);
  }
}
