import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../_services/auth-service';

// =====================================================================
// HATA SAYFASI (403 ve 404 tek component)
// Hangisi olduğu rotadaki data.code'dan geliyor:
//   /forbidden → 403 (rolü yetmeyen biri korumalı bir sayfaya girdi; AuthGuard yönlendiriyor)
//   **         → 404 (olmayan bir adres)
// Tam ekran; MainLayout'a bağlı değil.
// =====================================================================
@Component({
  selector: 'app-error-page',
  standalone: false,
  templateUrl: './error-page.html',
  styleUrl: './error-page.css'
})
export class ErrorPage implements OnInit {

  // Location: tarayıcı geçmişi (Geri dön butonu için)
  constructor(private route: ActivatedRoute,
              private router: Router,
              private location: Location,
              public authService: AuthService) {}

  code: 403 | 404 = 404;
  loggedIn = false;
  homeRoute = '/';         // giriş yapmışsa kendi paneli (/admin, /writer, /account)
  requestedUrl = '';       // 404'te hangi adresin bulunamadığını göstermek için

  ngOnInit(): void {
    this.code = this.route.snapshot.data['code'] ?? 404;
    this.loggedIn = this.authService.loggedIn();
    this.homeRoute = this.loggedIn ? this.authService.getHomeRoute() : '/';
    this.requestedUrl = this.router.url;
  }

  // İkinci rakam: 404 → "4", 403 → "3"
  get lastDigit(): string {
    return String(this.code).slice(-1);
  }

  get title(): string {
    return this.code === 403 ? 'Bu sayfaya erişim yetkin yok' : 'Aradığın sayfa bulunamadı';
  }

  get message(): string {
    return this.code === 403
      ? 'Bu alan farklı bir yetki gerektiriyor. Kendi paneline dönebilir ya da yetkili bir hesapla giriş yapabilirsin.'
      : 'Sayfa taşınmış, silinmiş ya da adres yanlış yazılmış olabilir.';
  }

  goBack() {
    this.location.back();
  }

  // 403: farklı bir hesapla girmek için çıkış yap (logout giriş sayfasına yönlendirir)
  switchAccount() {
    this.authService.logout();
  }
}
