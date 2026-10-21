import { AfterViewInit, Component, ElementRef, EventEmitter, NgZone, OnDestroy, Output, ViewChild } from '@angular/core';
import { TURNSTILE_SITE_KEY } from '../../../_constans/turnstile';   // src/_constans/turnstile.ts

declare const turnstile: any;   // index.html'deki Cloudflare script'inin sağladığı nesne

@Component({
  selector: 'app-turnstile',
  standalone: false,
  templateUrl: './turnstile.html',
  styleUrl: './turnstile.css'
})
export class Turnstile implements AfterViewInit, OnDestroy {

  constructor(private ngZone: NgZone) {}

  // HTML'deki <div #container> → kutucuk bunun içine çizilecek
  @ViewChild('container') container: ElementRef;

  // @Output: component'ten DIŞARIYA haber vermek için.
  // Kullanan sayfa (tokenChange)="..." ile dinler:
  //   token gelince → token değeri, süresi dolunca/hata olunca → null
  @Output() tokenChange = new EventEmitter<string | null>();

  private widgetId: string | null = null;   // çizilen kutucuğun kimliği (sıfırlamak için lazım)

  ngAfterViewInit(): void {
    this.render();
  }

  // Script async yüklendiği için hazır değilse 100 ms sonra tekrar dene (en fazla 5 sn)
  private render(attempt = 0) {

    if (typeof turnstile === 'undefined') {
      if (attempt < 50) {
        setTimeout(() => this.render(attempt + 1), 100);
      }
      return;
    }

    this.widgetId = turnstile.render(this.container.nativeElement, {
      sitekey: TURNSTILE_SITE_KEY,
      language: 'tr',
      theme: 'light',

      // Cloudflare'in kodu Angular'ın dışında çalıştığı için ngZone.run ile içeri alıyoruz

      // Doğrulama başarılı → token'ı sayfaya ilet
      callback: (token: string) => this.ngZone.run(() => this.tokenChange.emit(token)),

      // Token'ın süresi doldu (yaklaşık 5 dk) → artık geçersiz
      'expired-callback': () => this.ngZone.run(() => this.tokenChange.emit(null)),

      // Kutucuk yüklenemedi ya da doğrulama hata verdi
      'error-callback': () => this.ngZone.run(() => this.tokenChange.emit(null))
    });
  }

  // Token'lar TEK KULLANIMLIK: başarısız denemeden sonra yeni token için kutucuğu sıfırla
  reset() {
    if (this.widgetId !== null) {
      turnstile.reset(this.widgetId);
      this.tokenChange.emit(null);
    }
  }

  // Sayfadan çıkılınca kutucuğu kaldır
  ngOnDestroy(): void {
    if (this.widgetId !== null) {
      turnstile.remove(this.widgetId);
    }
  }
}
