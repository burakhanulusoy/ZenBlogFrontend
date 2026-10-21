import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { AuthService } from '../../_services/auth-service';

declare const bootstrap: any;   // bootstrap.bundle.min.js'in sağladığı nesne (offcanvas'ı kapatmak için)

@Component({
  selector: 'app-admin-layout',
  standalone: false,
  styleUrl: './admin-layout.css',
  templateUrl: './admin-layout.html',
})
export class AdminLayout implements OnInit, OnDestroy {

  // public: HTML'de authService.getFullName() ve logout() kullanabilmek için
  constructor(public authService: AuthService,
              private router: Router) {}

  fullName = '';
  private routerSubscription: Subscription;

  ngOnInit(): void {
    this.fullName = this.authService.getFullName();

    // Mobilde menüden bir sayfaya geçince açık olan yan menüyü kapat.
    // NavigationEnd: yeni sayfaya geçiş tamamlandığında gelen olay.
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        const sidebar = document.getElementById('adminSidebar');
        bootstrap.Offcanvas.getInstance(sidebar)?.hide();
      });
  }

  // Ad soyadın baş harfleri → kullanıcı kartındaki yuvarlak avatar için ("Tarık Yılmaz" → "TY")
  get initials(): string {
    return this.fullName
      .split(' ')
      .filter(part => part)
      .map(part => part[0].toUpperCase())
      .slice(0, 2)
      .join('');
  }

  // Sayfadan çıkınca router aboneliğini bırak (bellekte asılı kalmasın)
  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }
}
