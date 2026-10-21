import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { MenuItem } from 'primeng/api';
import { AuthService } from '../../_services/auth-service';

// Menüdeki tek bir bağlantı
interface NavItem {
  label: string;
  icon: string;      // PrimeIcons sınıfı (pi pi-...)
  link: string;
  exact?: boolean;   // true → sadece tam bu adreste "seçili" görünsün
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

// =====================================================================
// YAZAR PANELİ ÇERÇEVESİ (piksel tasarım)
// En dış kutuda "zb-pixel" sınıfı var → içindeki ortak sayfalar
// (Bloglarım, Blog detayı...) kendiliğinden piksel görünüme geçiyor.
// =====================================================================
@Component({
  selector: 'app-writer-layout',
  standalone: false,
  templateUrl: './writer-layout.html',
  styleUrl: './writer-layout.css'
})
export class WriterLayout implements OnInit, OnDestroy {

  constructor(public authService: AuthService,
              private router: Router,
              private route: ActivatedRoute) {}

  fullName = '';
  email = '';
  mobileMenuVisible = false;
  pageTitle = '';

  menuGroups: NavGroup[] = [
    {
      title: 'Genel',
      items: [
        { label: 'Genel bakış', icon: 'pi pi-home', link: '/writer', exact: true }
      ]
    },
    {
      title: 'Yazılarım',
      items: [
        { label: 'Bloglarım', icon: 'pi pi-book', link: '/writer/my-blogs' },
        { label: 'Yeni blog yaz', icon: 'pi pi-pencil', link: '/writer/new-blog' }
      ]
    }
  ];

  userMenuItems: MenuItem[] = [];

  private routerSubscription: Subscription;

  ngOnInit(): void {
    this.fullName = this.authService.getFullName();
    this.email = this.authService.getEmail();

    this.userMenuItems = [
      { label: 'Siteyi görüntüle', icon: 'pi pi-external-link', url: '/', target: '_blank' },
      { separator: true },
      { label: 'Çıkış yap', icon: 'pi pi-sign-out', command: () => this.authService.logout() }
    ];

    this.updatePageTitle();

    // Her sayfa geçişinde: mobil menüyü kapat + başlığı güncelle
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.mobileMenuVisible = false;
        this.updatePageTitle();
      });
  }

  // En içteki rotanın data.title değeri → üst çubuktaki sayfa adı
  private updatePageTitle() {
    let current = this.route;
    while (current.firstChild) {
      current = current.firstChild;
    }
    this.pageTitle = current.snapshot.data?.['title'] ?? '';
  }

  get initials(): string {
    return this.fullName
      .split(' ')
      .filter(part => part)
      .map(part => part[0].toLocaleUpperCase('tr'))
      .slice(0, 2)
      .join('') || 'Y';
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }
}
