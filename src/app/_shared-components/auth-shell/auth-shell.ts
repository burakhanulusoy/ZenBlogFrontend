import { Component, Input } from '@angular/core';

// =====================================================================
// KİMLİK DOĞRULAMA ÇERÇEVESİ
// Giriş, kayıt, e-posta doğrulama, şifremi unuttum sayfalarının ORTAK tasarımı.
// Solda marka paneli, sağda formun geleceği alan.
// Kullanım:  <app-auth-shell heading="..." subheading="..."> form buraya </app-auth-shell>
// <ng-content>: dışarıdan verilen içeriğin yerleşeceği yer (Razor'daki @RenderBody gibi)
// =====================================================================
@Component({
  selector: 'app-auth-shell',
  standalone: false,
  templateUrl: './auth-shell.html',
  styleUrl: './auth-shell.css'
})
export class AuthShell {

  // Not: "title" yerine "heading" dedik; title adında bir input HTML'in title
  // özelliğine de yazılır ve sayfanın her yerinde ipucu baloncuğu çıkarır.
  @Input() heading = '';
  @Input() subheading = '';
  @Input() icon = '';        // başlığın üstündeki ikon (pi pi-...), boşsa gösterilmez
  @Input() wide = false;     // kayıt formu gibi uzun formlar için daha geniş alan

  readonly year = new Date().getFullYear();
}
