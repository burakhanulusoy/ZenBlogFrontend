import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { MenuItem } from 'primeng/api';
import { AuthService } from '../../_services/auth-service';

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
// ADMİN PANELİ ÇERÇEVESİ (kurumsal tasarım)
// Koyu sol menü (masaüstünde daraltılabilir) + üst çubuk + sayfa içeriği
// =====================================================================
@Component({
  selector: 'app-admin-layout',
  standalone: false,
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css'
})
export class AdminLayout implements OnInit, OnDestroy {

  constructor(public authService: AuthService,
              private router: Router,
              private route: ActivatedRoute) {}

  fullName = '';
  email = '';
  pageTitle = '';
  todayText = '';

  mobileMenuVisible = false;   // mobilde soldan açılan menü
  collapsed = false;           // masaüstünde menü sadece ikon mu?

  // Daraltma tercihinin tarayıcıda saklandığı anahtar
  private readonly collapseKey = 'zb-admin-sidebar-collapsed';

  // ÜSTTEKİ MENÜ: site yönetimi
  menuGroups: NavGroup[] = [
    {
      title: 'Genel',
      items: [
        { label: 'Genel bakış', icon: 'pi pi-th-large', link: '/admin', exact: true }
      ]
    },
    {
      title: 'Site yönetimi',
      items: [
        { label: 'Tüm bloglar', icon: 'pi pi-book', link: '/admin/blogs' },
        { label: 'Kategoriler', icon: 'pi pi-tags', link: '/admin/category' }
      ]
    }
  ];

    // ALTTAKİ MENÜ: admin'in kendi içerikleri
  // DEĞİŞTİ: "Yeni blog yaz" kaldırıldı (Bloglarım sayfasındaki butondan yazılıyor)
  personalGroup: NavGroup = {
    title: 'Size özel',
    items: [
      { label: 'Bloglarım', icon: 'pi pi-file-edit', link: '/admin/my-blogs' }
    ]
  };

  userMenuItems: MenuItem[] = [];

  private routerSubscription: Subscription;

  ngOnInit(): void {
    this.fullName = this.authService.getFullName();
    this.email = this.authService.getEmail();

    // "21 Ekim 2026, Çarşamba" (tr-TR: Türkçe ay ve gün adları)
    this.todayText = new Date().toLocaleDateString('tr-TR', {
      day: 'numeric', month: 'long', year: 'numeric', weekday: 'long'
    });

    // Daraltma tercihini oku (tarayıcı izin vermezse varsayılan: açık)
    try {
      this.collapsed = localStorage.getItem(this.collapseKey) === 'true';
    } catch {
      this.collapsed = false;
    }

    this.userMenuItems = [
      { label: 'Siteyi görüntüle', icon: 'pi pi-external-link', url: '/', target: '_blank' },
      { separator: true },
      { label: 'Çıkış yap', icon: 'pi pi-sign-out', command: () => this.authService.logout() }
    ];

    this.updatePageTitle();

    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.mobileMenuVisible = false;
        this.updatePageTitle();
      });
  }

  // ☰ butonu: mobilde menüyü aç, masaüstünde daralt/genişlet
  toggleMenu() {
    if (window.innerWidth < 992) {
      this.mobileMenuVisible = true;
      return;
    }

    this.collapsed = !this.collapsed;
    try {
      localStorage.setItem(this.collapseKey, String(this.collapsed));
    } catch {
      // tarayıcı saklamaya izin vermiyorsa sessizce geç
    }
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
      .join('') || 'A';
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }
}
