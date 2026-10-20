import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../_services/auth-service';

declare const alertify: any;

@Component({
  selector: 'app-verify-email',
  standalone: false,
  templateUrl: './verify-email.html',
  styleUrl: './verify-email.css'
})
export class VerifyEmail implements OnInit, OnDestroy {

  constructor(private authService: AuthService,
              private route: ActivatedRoute,   // adresteki ?email=... bilgisini okumak için
              private router: Router) {}

  email = '';
  code = '';

  isLoading = false;      // "Doğrula" isteği sürerken
  isResending = false;    // "Kodu tekrar gönder" isteği sürerken
  errorMessage = '';

  countdown = 0;          // "tekrar gönder" butonu için kalan saniye
  private timer: any;     // geri sayımı yapan zamanlayıcı

  ngOnInit(): void {
    // Adresteki bilgileri oku: /verify-email?email=ali@mail.com&sent=true
    const params = this.route.snapshot.queryParamMap;

    this.email = params.get('email') ?? '';

    // Kayıttan geliyorsak kod AZ ÖNCE gönderildi; hemen tekrar göndermesin diye 60 sn beklet
    if (params.get('sent') === 'true') {
      this.startCountdown();
    }
  }

  // Sayfadan çıkılınca zamanlayıcıyı durdur (arka planda çalışmaya devam etmesin)
  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  // ---------------------------------------------------------------
  // KODU DOĞRULA
  // ---------------------------------------------------------------
  confirm() {

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.confirmEmail(this.email, this.code).subscribe({

      next: result => {
        alertify.success("E-posta adresin doğrulandı!");

        // Login sayfasına git; e-posta dolu gelsin ve "doğrulandı" mesajı görünsün
        this.router.navigate(["/login"], { queryParams: { email: this.email, verified: true } });
      },

      error: err => {
        this.isLoading = false;

        this.errorMessage = err.status === 0
          ? "Sunucuya ulaşılamadı. Lütfen daha sonra tekrar deneyin."
          : err.error?.errors?.[0]?.errorMessage ?? "Doğrulama sırasında bir sorun oluştu.";
          // Örn: "Kod geçersiz veya süresi dolmuş." / "Çok fazla deneme yaptınız..."
      }
    });
  }

  // ---------------------------------------------------------------
  // KODU TEKRAR GÖNDER
  // ---------------------------------------------------------------
  resend() {

    this.isResending = true;
    this.errorMessage = '';

    this.authService.resendConfirmation(this.email).subscribe({

      next: result => {
        this.isResending = false;
        // API güvenlik gereği her zaman aynı genel mesajı dönüyor
        alertify.success(result.data?.message ?? "Yeni kod gönderildi.");
        this.startCountdown();
      },

      error: err => {
        this.isResending = false;
        this.errorMessage = err.error?.errors?.[0]?.errorMessage ?? "Kod gönderilirken bir sorun oluştu.";
      }
    });
  }

  // 60 saniyelik geri sayım: bitene kadar "tekrar gönder" butonu pasif
  // (backend'de de dakikada 5 istek sınırı var; bu, kullanıcının o sınıra takılmasını önlüyor)
  private startCountdown(seconds = 60) {
    this.countdown = seconds;
    clearInterval(this.timer);

    // setInterval: içindeki kodu her 1000 ms'de (1 saniye) bir çalıştırır
    this.timer = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(this.timer);
      }
    }, 1000);
  }
}
