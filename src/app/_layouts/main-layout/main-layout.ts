import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { AuthService } from '../../_services/auth-service';
import { SiteService } from '../../_services/site-service';
import { CategoryDto } from '../../_models/category';
import { ContactDto } from '../../_models/contact';
import { SocialMediaDto } from '../../_models/site-content';

// =====================================================================
// ZİYARETÇİ SİTESİ ÇERÇEVESİ
// Header (menü, kategoriler, sosyal ikonlar, giriş) + sayfa içeriği + footer.
// En dış kutuda "zb-site" sınıfı → sitenin bütün stilleri sadece burada geçerli.
// =====================================================================
@Component({
  selector: 'main-layout',
  standalone: false,
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css'
})
export class MainLayout implements OnInit, OnDestroy {

  // public: şablonda authService.loggedIn() kullanmak için
  constructor(public authService: AuthService,
              private siteService: SiteService,
              private router: Router) {}

  categories: CategoryDto[] = [];
  socials: SocialMediaDto[] = [];
  contact: ContactDto | null = null;

  mobileOpen = false;          // mobil menü açık mı
  mobileCategoriesOpen = false; // mobil menüde kategoriler açık mı
  scrolled = false;            // sayfa kaydırıldı mı (header'a gölge)
  showScrollTop = false;       // "yukarı çık" butonu görünsün mü

  readonly year = new Date().getFullYear();

  private subscriptions = new Subscription();   // hepsini tek seferde kapatmak için

  ngOnInit(): void {
    // Ortak veriler (SiteService önbellekli: sayfalar aynı veriyi isteyince tekrar istek atılmaz)
    this.subscriptions.add(this.siteService.getCategories().subscribe(c => this.categories = c));
    this.subscriptions.add(this.siteService.getSocials().subscribe(s => this.socials = s));
    this.subscriptions.add(this.siteService.getContact().subscribe(c => this.contact = c));

    // Her sayfa geçişinde mobil menüyü kapat
    this.subscriptions.add(
      this.router.events
        .pipe(filter(e => e instanceof NavigationEnd))
        .subscribe(() => this.closeMobile())
    );
  }

  // ---------------------------------------------------------------
  // KAYDIRMA: Angular dinleyiciyi component kapanınca kendisi temizler
  // ---------------------------------------------------------------
  @HostListener('window:scroll')
  onScroll() {
    const y = window.scrollY;
    this.scrolled = y > 10;
    this.showScrollTop = y > 400;
  }

  // Esc ile mobil menüyü kapat
  @HostListener('document:keydown.escape')
  onEscape() {
    this.closeMobile();
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ---------------------------------------------------------------
  // MOBİL MENÜ
  // ---------------------------------------------------------------
  toggleMobile() {
    this.mobileOpen ? this.closeMobile() : this.openMobile();
  }

  private openMobile() {
    this.mobileOpen = true;
    document.body.style.overflow = 'hidden';   // menü açıkken arkadaki sayfa kaymasın
  }

  closeMobile() {
    this.mobileOpen = false;
    this.mobileCategoriesOpen = false;
    document.body.style.overflow = '';
  }

  // ---------------------------------------------------------------
  // GİRİŞ YAPMIŞ KULLANICI
  // ---------------------------------------------------------------
  get isLoggedIn(): boolean {
    return this.authService.loggedIn();
  }

  get panelRoute(): string {
    return this.authService.getHomeRoute();   // rolüne göre /admin, /writer, /account
  }

  get firstName(): string {
    return this.authService.getFullName().split(' ')[0] || 'Hesabım';
  }

  get userImage(): string {
    return this.authService.getImageUrl();
  }

  get initials(): string {
    return this.authService.getFullName()
      .split(' ').filter(p => p).map(p => p[0].toLocaleUpperCase('tr')).slice(0, 2).join('');
  }

  logout() {
    this.closeMobile();
    this.authService.logout();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    document.body.style.overflow = '';
  }
}
