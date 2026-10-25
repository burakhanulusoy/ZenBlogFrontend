import { Component, OnInit } from '@angular/core';
import { catchError, forkJoin, map, of } from 'rxjs';
import { AboutService } from '../../_services/about-service';
import { TeamService } from '../../_services/team-service';
import { AuthService } from '../../_services/auth-service';
import { AboutDto } from '../../_models/site-content';
import { PLATFORM_LABELS, TeamDto } from '../../_models/team';

// =====================================================================
// SİTE: HAKKIMIZDA  →  /about
// En son eklenen Hakkımızda içeriği + Ekip.
// forkJoin: iki isteği AYNI ANDA gönderir, ikisi de bitince sonucu verir (C#: Task.WhenAll).
// Her isteğin kendi catchError'u var: biri başarısız olsa bile diğeri gösterilir.
// =====================================================================
@Component({
  selector: 'app-site-about',
  standalone: false,
  templateUrl: './site-about.html',
  styleUrl: './site-about.css'
})
export class SiteAbout implements OnInit {

  constructor(private aboutService: AboutService,
              private teamService: TeamService,
              public authService: AuthService) {}

  about: AboutDto | null = null;
  team: TeamDto[] = [];
  isLoading = true;

  // "Devamını oku" açık olan üyeler (Set: tekrar etmeyen değerler, C#: HashSet)
  expanded = new Set<string>();

  ngOnInit(): void {
    forkJoin({
      about: this.aboutService.getAll().pipe(
        map(r => r.data?.[0] ?? null),   // en yeni → sitede yayında olan
        catchError(() => of(null))
      ),
      team: this.teamService.getAll().pipe(
        map(r => r.data ?? []),
        catchError(() => of([] as TeamDto[]))
      )
    }).subscribe(result => {
      this.about = result.about;
      this.team = result.team;
      this.isLoading = false;
    });
  }

  // ---------------------------------------------------------------
  // EKİP
  // ---------------------------------------------------------------
  toggle(id: string) {
    this.expanded.has(id) ? this.expanded.delete(id) : this.expanded.add(id);
  }

  // Açıklama 4 satırı geçecek kadar uzun mu? (yaklaşık; "Devamını oku" sadece gerekince çıksın)
  isLong(text: string): boolean {
    return (text ?? '').length > 180;
  }

  platformLabel(name: string): string {
    return PLATFORM_LABELS[name] ?? name;
  }

  // Çağrı bandı: giriş yapmamışsa kayıt, yapmışsa panel
   // ---------------------------------------------------------------
  // ÇAĞRI ALANI: kişinin durumuna göre farklı mesaj ve hedef
  // ---------------------------------------------------------------
  get isLoggedIn(): boolean {
    return this.authService.loggedIn();
  }

  // Yazar ya da Admin → zaten yazabiliyor
  get canWrite(): boolean {
    return this.isLoggedIn && this.authService.hasAnyRole(['Writer', 'Admin']);
  }

  get firstName(): string {
    return this.authService.getFullName().split(' ')[0] || '';
  }

  // Önizleme kartındaki yazar adı: giriş yapmışsa kendi adı
  get previewName(): string {
    return this.isLoggedIn ? this.authService.getFullName() : 'Senin adın';
  }

  get previewInitials(): string {
    return this.isLoggedIn
      ? this.authService.getFullName().split(' ').filter(p => p).map(p => p[0].toLocaleUpperCase('tr')).slice(0, 2).join('')
      : '?';
  }

  get previewImage(): string {
    return this.isLoggedIn ? this.authService.getImageUrl() : '';
  }

  // Başlık: giriş yapmışsa adıyla hitap
  get ctaTitle(): string {
    if (this.canWrite) return `${this.firstName}, okurların yeni yazını bekliyor`;
    if (this.isLoggedIn) return `${this.firstName}, sıradaki yazı seninki olabilir`;
    return 'Sıradaki yazı seninki olabilir';
  }

  // Buton hedefi
  get ctaLink(): string {
    if (this.canWrite) {
      return this.authService.hasAnyRole(['Admin']) ? '/admin/new-blog' : '/writer/new-blog';
    }
    return this.isLoggedIn ? '/account/become-writer' : '/register';
  }

  get ctaLabel(): string {
    if (this.canWrite) return 'Yeni yazını yayınla';
    return this.isLoggedIn ? 'Yazarlık başvurusu yap' : 'Ücretsiz kayıt ol';
  }

  // "3 adımda yazar ol": tamamlanan adımlar işaretli görünsün
  get stepDone(): number {
    if (this.canWrite) return 3;
    return this.isLoggedIn ? 1 : 0;
  }

  trackById(_: number, item: { id: string }) {
    return item.id;
  }
}
