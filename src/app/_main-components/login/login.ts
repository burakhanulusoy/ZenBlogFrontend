import { AfterViewInit, Component, ElementRef, NgZone, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../_services/auth-service';
import { LoginDto } from '../../_models/loginDto';
import { Turnstile } from '../../_shared-components/turnstile/turnstile';   // YENİ
import { GOOGLE_CLIENT_ID } from '../../../_constans/google';

declare const alertify: any;
declare const google: any;   // index.html'deki Google script'inin sağladığı nesne

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements OnInit, AfterViewInit {

  constructor(private authService: AuthService,
              private route: ActivatedRoute,
              private router: Router,
              private ngZone: NgZone) {}

  // HTML'deki <div #googleButton> → Google butonu bu kutunun içine çizilecek
  @ViewChild('googleButton') googleButton: ElementRef;

  // YENİ: HTML'deki <app-turnstile> → başarısız denemede reset() ile sıfırlamak için
  @ViewChild(Turnstile) turnstile: Turnstile;

  loginDto: LoginDto = new LoginDto();

  showPassword = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  turnstileToken: string | null = null;   // YENİ: kutucuk doğrulanınca dolar

  ngOnInit(): void {
    if (this.authService.loggedIn()) {
      this.router.navigate([this.authService.isAdmin() ? "/admin" : "/"]);
      return;
    }

    // Doğrulama ya da şifre sıfırlama sayfasından geldiysek e-postayı doldur ve mesaj göster
    const params = this.route.snapshot.queryParamMap;

    const email = params.get('email');
    if (email) {
      this.loginDto.email = email;
    }

    if (params.get('verified') === 'true') {
      this.successMessage = "E-posta adresin doğrulandı. Şimdi giriş yapabilirsin.";
    }

    if (params.get('reset') === 'true') {
      this.successMessage = "Şifren güncellendi. Yeni şifrenle giriş yapabilirsin.";
    }
  }

  // HTML çizildikten SONRA çalışır (googleButton kutusu ancak o zaman var)
  ngAfterViewInit(): void {
    this.renderGoogleButton();
  }

  // ---------------------------------------------------------------
  // NORMAL GİRİŞ (e-posta + şifre)
  // ---------------------------------------------------------------
  login() {

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // DEĞİŞTİ: Turnstile token'ı da gönderiliyor (71. satırdaki hatanın çözümü)
    this.authService.login(this.loginDto, this.turnstileToken).subscribe({

      next: result => this.onLoginSuccess(result.data.token),

      error: err => {
        this.isLoading = false;

        // YENİ: Token tek kullanımlık; yeni deneme için kutucuğu sıfırla
        this.turnstile?.reset();

        if (err.status === 0) {
          this.errorMessage = "Sunucuya ulaşılamadı. Lütfen daha sonra tekrar deneyin.";
          return;
        }

        const firstError = err.error?.errors?.[0];

        // E-posta doğrulanmamışsa doğrulama sayfasına gönder (backend'in KODUNA bakıyoruz)
        if (firstError?.propertyName === 'EmailNotConfirmed') {
          alertify.warning("Giriş yapmadan önce e-posta adresini doğrulamalısın.");
          this.router.navigate(["/verify-email"], { queryParams: { email: this.loginDto.email } });
          return;
        }

        this.errorMessage = firstError?.errorMessage ?? "Giriş yapılırken bir sorun oluştu.";
      }
    });
  }

  // ---------------------------------------------------------------
  // GOOGLE İLE GİRİŞ
  // ---------------------------------------------------------------
  // Google script'i async yüklendiği için hazır değilse 100 ms sonra tekrar deniyoruz (en fazla 5 sn)
  private renderGoogleButton(attempt = 0) {

    if (typeof google === 'undefined' || !google.accounts) {
      if (attempt < 50) {
        setTimeout(() => this.renderGoogleButton(attempt + 1), 100);
      }
      return;
    }

    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      // Google'ın kodu Angular'ın dışında çalıştığı için ngZone.run ile içeri alıyoruz
      callback: (response: any) => {
        this.ngZone.run(() => this.loginWithGoogle(response.credential));
      }
    });

    google.accounts.id.renderButton(this.googleButton.nativeElement, {
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      shape: 'rectangular',
      locale: 'tr',
      width: 320
    });
  }

  private loginWithGoogle(idToken: string) {

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.googleLogin(idToken).subscribe({

      next: result => this.onLoginSuccess(result.data.token),

      error: err => {
        this.isLoading = false;
        this.errorMessage = err.status === 0
          ? "Sunucuya ulaşılamadı. Lütfen daha sonra tekrar deneyin."
          : err.error?.errors?.[0]?.errorMessage ?? "Google ile giriş yapılırken bir sorun oluştu.";
      }
    });
  }

  // İki giriş türünün de ortak başarı adımı
  private onLoginSuccess(token: string) {
    localStorage.setItem("token", token);
    alertify.success("Giriş başarılı, hoş geldin!");
    this.router.navigate([this.authService.isAdmin() ? "/admin" : "/"]);
  }
}
