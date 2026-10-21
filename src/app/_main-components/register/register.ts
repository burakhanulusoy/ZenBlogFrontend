import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../_services/auth-service';
import { RegisterDto } from '../../_models/registerDto';
import { Turnstile } from '../../_shared-components/turnstile/turnstile';   // YENİ

declare const alertify: any;

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register implements OnInit {

  constructor(private authService: AuthService,
              private router: Router) {}

  // YENİ: HTML'deki <app-turnstile> → başarısız denemede reset() ile sıfırlamak için
  @ViewChild(Turnstile) turnstile: Turnstile;

  registerDto: RegisterDto = new RegisterDto();

  showPassword = false;
  isLoading = false;
  errors: any[] = [];
  generalError = '';

  turnstileToken: string | null = null;   // YENİ: kutucuk doğrulanınca dolar

  // Formda gösterdiğimiz alanlar. API hatası bunlardan birine aitse o alanın altında,
  // değilse (örneğin "Turnstile" hatası) formun üstünde gösterilir.
  private readonly formFields = ['Name', 'Surname', 'UserName', 'Email', 'PhoneNumber', 'Password', 'ConfirmPassword'];

  ngOnInit(): void {
    if (this.authService.loggedIn()) {
      this.router.navigate([this.authService.isAdmin() ? "/admin" : "/"]);
    }
  }

  // ---------------------------------------------------------------
  // CANLI ŞİFRE KURALLARI (backend'deki Identity ayarlarıyla aynı)
  // ---------------------------------------------------------------
  private get password(): string {
    return this.registerDto.password ?? '';
  }

  get hasMinLength() { return this.password.length >= 8; }
  get hasUpper()     { return /[A-Z]/.test(this.password); }
  get hasLower()     { return /[a-z]/.test(this.password); }
  get hasDigit()     { return /[0-9]/.test(this.password); }
  get hasSpecial()   { return /[^A-Za-z0-9]/.test(this.password); }

  get passwordValid() {
    return this.hasMinLength && this.hasUpper && this.hasLower && this.hasDigit && this.hasSpecial;
  }

  get passwordsMismatch() {
    return !!this.registerDto.confirmPassword && this.registerDto.confirmPassword !== this.registerDto.password;
  }

  // ---------------------------------------------------------------
  // API HATALARINI ALANLARA DAĞITMA
  // ---------------------------------------------------------------
  private mapToField(propertyName: string): string {
    if (propertyName.startsWith('Password')) return 'Password';
    if (propertyName === 'DuplicateEmail' || propertyName === 'InvalidEmail') return 'Email';
    if (propertyName === 'DuplicateUserName' || propertyName === 'InvalidUserName') return 'UserName';
    return propertyName;
  }

  errorsFor(field: string): string[] {
    return this.errors
      .filter(e => this.mapToField(e.propertyName) === field)
      .map(e => e.errorMessage);
  }

  get otherErrors(): string[] {
    return this.errors
      .filter(e => !this.formFields.includes(this.mapToField(e.propertyName)))
      .map(e => e.errorMessage);
  }

  // ---------------------------------------------------------------
  // KAYIT
  // ---------------------------------------------------------------
  register() {

    this.isLoading = true;
    this.errors = [];
    this.generalError = '';

    // DEĞİŞTİ: Turnstile token'ı da gönderiliyor
    this.authService.register(this.registerDto, this.turnstileToken).subscribe({

      next: result => {
        alertify.success(result.data?.message ?? "Kayıt başarılı!");

        // Doğrulama sayfasına git (e-posta dolu gelsin, "tekrar gönder" 60 sn beklesin)
        this.router.navigate(["/verify-email"], {
          queryParams: { email: this.registerDto.email, sent: true }
        });
      },

      error: err => {
        this.isLoading = false;

        // YENİ: Token tek kullanımlık; yeni deneme için kutucuğu sıfırla
        this.turnstile?.reset();

        if (err.status === 0) {
          this.generalError = "Sunucuya ulaşılamadı. Lütfen daha sonra tekrar deneyin.";
          return;
        }

        this.errors = err.error?.errors ?? [];

        if (this.errors.length === 0) {
          this.generalError = "Kayıt sırasında bir sorun oluştu.";
        }
      }
    });
  }
}
