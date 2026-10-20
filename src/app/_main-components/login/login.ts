import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../_services/auth-service';
import { LoginDto } from '../../_models/loginDto';

declare const alertify: any;

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements OnInit {

  constructor(private authService: AuthService,
              private route: ActivatedRoute,   // YENİ: adresteki ?email=...&verified=true için
              private router: Router) {}

  loginDto: LoginDto = new LoginDto();

  showPassword = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';   // YENİ: doğrulamadan gelince yeşil mesaj

  ngOnInit(): void {
    if (this.authService.loggedIn()) {
      this.router.navigate([this.authService.isAdmin() ? "/admin" : "/"]);
      return;
    }

    // YENİ: Doğrulama sayfasından geldiysek e-postayı doldur ve mesaj göster
    const params = this.route.snapshot.queryParamMap;

    const email = params.get('email');
    if (email) {
      this.loginDto.email = email;
    }

    if (params.get('verified') === 'true') {
      this.successMessage = "E-posta adresin doğrulandı. Şimdi giriş yapabilirsin.";
    }
  }

  login() {

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.login(this.loginDto).subscribe({

      next: result => {
        localStorage.setItem("token", result.data.token);
        alertify.success("Giriş başarılı, hoş geldin!");
        this.router.navigate([this.authService.isAdmin() ? "/admin" : "/"]);
      },

      error: err => {
        this.isLoading = false;

        if (err.status === 0) {
          this.errorMessage = "Sunucuya ulaşılamadı. Lütfen daha sonra tekrar deneyin.";
          return;
        }

        const firstError = err.error?.errors?.[0];

        // YENİ: E-posta doğrulanmamışsa doğrulama sayfasına gönder
        // (mesaja değil, backend'in gönderdiği KODA bakıyoruz)
        if (firstError?.propertyName === 'EmailNotConfirmed') {
          alertify.warning("Giriş yapmadan önce e-posta adresini doğrulamalısın.");
          this.router.navigate(["/verify-email"], { queryParams: { email: this.loginDto.email } });
          return;
        }

        this.errorMessage = firstError?.errorMessage ?? "Giriş yapılırken bir sorun oluştu.";
      }
    });
  }
}
