import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { MenuItem } from 'primeng/api';
import { AuthService } from '../../_services/auth-service';

interface NavItem {
  label: string;
  icon: string;
  link: string;
  exact?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

// =====================================================================
// OKUR (USER) PANELİ ÇERÇEVESİ (piksel tasarım)
// Görünüm writer paneliyle aynı → CSS dosyası ortak (writer-layout.css).
// En dış kutuda "zb-pixel" var → Profilim gibi ortak sayfalar piksel görünür.
// =====================================================================
@Component({
  selector: 'app-user-layout',
  standalone: false,
  templateUrl: './user-layout.html',
  styleUrl: '../writer-layout/writer-layout.css'   // writer'la aynı tasarım
})
export class UserLayout implements OnInit, OnDestroy {

  constructor(public authService: AuthService,
              private router: Router,
              private route: ActivatedRoute) {}

  fullName = '';
  email = '';
  mobileMenuVisible = false;
  pageTitle = '';
  imageUrl = '';   // YENİ: sağ üstteki avatar
  // Yorumlarım, yorum işleri yapılınca buraya eklenecek
  menuGroups: NavGroup[] = [
    {
      title: 'Hesabım',
      items: [
        { label: 'Profilim', icon: 'pi pi-user', link: '/account/profile' },
       { label: 'Yorumlarım', icon: 'pi pi-comments', link: '/account/my-comments' }
      ]
    }
  ];

  userMenuItems: MenuItem[] = [];

  private routerSubscription: Subscription;
  private userSubscription: Subscription;

  ngOnInit(): void {
    this.fullName = this.authService.getFullName();
    this.email = this.authService.getEmail();
    this.imageUrl = this.authService.getImageUrl();   // YENİ
    this.userMenuItems = [
      { label: 'Siteyi görüntüle', icon: 'pi pi-external-link', url: '/', target: '_blank' },
      { separator: true },
      { label: 'Çıkış yap', icon: 'pi pi-sign-out', command: () => this.authService.logout() }
    ];

    // Profilim'de ad soyad değişince sağ üstteki ad ve e-posta yenilensin
        this.userSubscription = this.authService.userChanged$.subscribe(() => {
      this.fullName = this.authService.getFullName();
      this.email = this.authService.getEmail();
      this.imageUrl = this.authService.getImageUrl();   // YENİ
    });

    this.updatePageTitle();

    // Her sayfa geçişinde: mobil menüyü kapat + başlığı güncelle
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.mobileMenuVisible = false;
        this.updatePageTitle();
      });
  }

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
      .join('') || 'O';
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
    this.userSubscription?.unsubscribe();
  }
}
