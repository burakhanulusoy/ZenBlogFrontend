import { Injectable } from '@angular/core';
import { Observable, catchError, map, of, shareReplay } from 'rxjs';
import { CategoryService } from './category-service';
import { SocialMediaService } from './social-media-service';
import { ContactService } from './contact-service';
import { CategoryDto } from '../_models/category';
import { ContactDto, } from '../_models/contact';
import { SocialMediaDto } from '../_models/site-content';

// =====================================================================
// ZİYARETÇİ SİTESİNİN ORTAK VERİLERİ (önbellekli)
// Header, footer ve sayfalar aynı verileri istiyor (kategoriler, sosyal medya, iletişim).
// shareReplay(1): ilk isteğin sonucunu SAKLAR; sonra kim abone olursa olsun
// sunucuya tekrar gitmeden saklanan sonucu verir. (C#: Lazy<T> / IMemoryCache gibi)
//
// ??= : "değişken boşsa sağdakini ata" → Observable sadece İLK çağrıda oluşturulur.
// catchError: hata olursa boş değer dön; header/footer çökmesin, sadece o kısım boş kalsın.
// =====================================================================
@Injectable({
  providedIn: 'root'
})
export class SiteService {

  constructor(private categoryService: CategoryService,
              private socialMediaService: SocialMediaService,
              private contactService: ContactService) {}

  private categories$?: Observable<CategoryDto[]>;
  private socials$?: Observable<SocialMediaDto[]>;
  private contact$?: Observable<ContactDto | null>;

  getCategories(): Observable<CategoryDto[]> {
    return this.categories$ ??= this.categoryService.getCategories().pipe(
      map(result => (result.data ?? []).sort((a, b) => a.name.localeCompare(b.name, 'tr'))),
      catchError(() => of([])),
      shareReplay(1)
    );
  }

  getSocials(): Observable<SocialMediaDto[]> {
    return this.socials$ ??= this.socialMediaService.getAll().pipe(
      map(result => result.data ?? []),
      catchError(() => of([])),
      shareReplay(1)
    );
  }

  // Sitede en son eklenen iletişim bilgisi kullanılır
  getContact(): Observable<ContactDto | null> {
    return this.contact$ ??= this.contactService.getAll().pipe(
      map(result => result.data?.[0] ?? null),
      catchError(() => of(null)),
      shareReplay(1)
    );
  }
}
