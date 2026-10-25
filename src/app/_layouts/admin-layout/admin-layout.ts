import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { MenuItem } from 'primeng/api';
import { AuthService } from '../../_services/auth-service';
import { WriterApplicationService } from '../../_services/writer-application-service';
import { ContactMessageService } from '../../_services/contact-message-service';

interface NavItem {
  label: string;
  icon: string;      // PrimeIcons sınıfı (pi pi-...)
  link: string;
  exact?: boolean;   // true → sadece tam bu adreste "seçili" görünsün
    badge?: 'applications' | 'messages';   // DEĞİŞTİ: mesaj rozeti de eklendi
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
              private applicationService: WriterApplicationService,   // YENİ
              private router: Router,
              private route: ActivatedRoute,
              private messageService:ContactMessageService) {}


  fullName = '';
  email = '';
    imageUrl = '';   // YENİ: sağ üstteki avatar
      pendingApplications = 0;   // YENİ: okunmamış başvuru sayısı (menü rozeti)
        pendingMessages = 0;   // YENİ: okunmamış mesaj sayısı
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
        { label: 'Kategoriler', icon: 'pi pi-tags', link: '/admin/category' },
        { label: 'Kullanıcılar', icon: 'pi pi-users', link: '/admin/users' } ,  // YENİ
                { label: 'Tüm yorumlar', icon: 'pi pi-comments', link: '/admin/comments' },   // YENİ
                        { label: 'Log kayıtları', icon: 'pi pi-server', link: '/admin/logs' },   // YENİ
        { label: 'Roller', icon: 'pi pi-shield', link: '/admin/roles' },   // YENİ
        { label: 'Yazarlık başvuruları', icon: 'pi pi-inbox', link: '/admin/writer-applications', badge: 'applications' } ,  // YENİ
        { label: 'Gelen mesajlar', icon: 'pi pi-envelope', link: '/admin/contact-messages', badge: 'messages' }   // YENİ

      ]
    },
    // YENİ: ziyaretçi sitesinde görünen içerikler
    {
      title: 'Site içeriği',
      items: [
        { label: 'Hakkımızda', icon: 'pi pi-info-circle', link: '/admin/abouts' },
        { label: 'Sosyal medya', icon: 'pi pi-share-alt', link: '/admin/social-medias' },
        { label: 'Ekip', icon: 'pi pi-id-card', link: '/admin/teams' },   // YENİ
        { label: 'İletişim bilgileri', icon: 'pi pi-map-marker', link: '/admin/contact-info' }   // YENİ
      ]
    },

  ];

    // ALTTAKİ MENÜ: admin'in kendi içerikleri
  // DEĞİŞTİ: "Yeni blog yaz" kaldırıldı (Bloglarım sayfasındaki butondan yazılıyor)
    // ALTTAKİ MENÜ: admin'in kendi içerikleri
    personalGroup: NavGroup = {
    title: 'Size özel',
    items: [
      { label: 'Bloglarım', icon: 'pi pi-file-edit', link: '/admin/my-blogs' },
      { label: 'Gelen yorumlar', icon: 'pi pi-inbox', link: '/admin/blog-comments' },   // YENİ
      { label: 'Yorumlarım', icon: 'pi pi-comment', link: '/admin/my-comments' },       // YENİ
      { label: 'Profilim', icon: 'pi pi-user', link: '/admin/profile' }
    ]
  };
  userMenuItems: MenuItem[] = [];

  private routerSubscription: Subscription;
  private userSubscription: Subscription;   // YENİ: profil güncellenince adı yenilemek için

  ngOnInit(): void {
    this.fullName = this.authService.getFullName();
    this.email = this.authService.getEmail();
    this.imageUrl = this.authService.getImageUrl();   // YENİ
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

        // YENİ: Profilim'de ad soyad değişince yeni token gelir → sağ üstteki ad ve e-posta yenilensin
      this.userSubscription = this.authService.userChanged$.subscribe(() => {
      this.fullName = this.authService.getFullName();
      this.email = this.authService.getEmail();
      this.imageUrl = this.authService.getImageUrl();   // YENİ
    });


    this.updatePageTitle();
    this.refreshPendingApplications();   // YENİ

    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.mobileMenuVisible = false;
        this.updatePageTitle();
                this.refreshPendingApplications();   // YENİ
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

    // YENİ: okunmamış başvuru sayısını getir (hata olursa rozet sessizce gizli kalır)
  private refreshPendingApplications() {
    this.applicationService.getPendingCount().subscribe({
      next: result => this.pendingApplications = result.data ?? 0,
      error: () => this.pendingApplications = 0
    });

        // YENİ: okunmamış mesajlar
    this.messageService.getPending().subscribe({
      next: result => this.pendingMessages = result.data?.length ?? 0,
      error: () => this.pendingMessages = 0
    });
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
    this.userSubscription?.unsubscribe();   // YENİ
  }
}
