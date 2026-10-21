import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BlogService } from '../../_services/blog-service';
import { SweetAlert } from '../../_services/sweet-alert';
import { BlogDto } from '../../_models/blog';

// İçindekiler listesindeki bir bölüm
interface SectionLink {
  id: string;      // sayfadaki bölümün id'si (kaydırmak için)
  no: string;      // "01"
  title: string;
}

// =====================================================================
// BLOG DETAYI (ortak sayfa)
// Blogu dergi sayfası gibi gösterir: kapak üstünde başlık, okuma çubuğu,
// numaralı bölümler, sağda yazar + bilgiler + içindekiler (o anki bölüm yanar).
// Hangi listeden açıldıysa ona döner: rotadaki data.returnTo ('blogs' ya da 'my-blogs')
// =====================================================================
@Component({
  selector: 'app-blog-detail',
  standalone: false,
  templateUrl: './blog-detail.html',
  styleUrl: './blog-detail.css'
})
export class BlogDetail implements OnInit {

  constructor(private blogService: BlogService,
              private swal: SweetAlert,
              private route: ActivatedRoute,
              private router: Router) {}

  // YENİ: HTML'deki #articleEl ile işaretli <article> elemanı
  // (okuma çubuğunu hesaplamak için yazının boyunu ve konumunu buradan okuyoruz)
  // *ngIf içinde olduğu için blog yüklenene kadar undefined
  @ViewChild('articleEl') articleEl?: ElementRef<HTMLElement>;

  blog: BlogDto | null = null;
  isLoading = true;
  errorMessage = '';

  readingMinutes = 1;
  wordCount = 0;
  sections: SectionLink[] = [];

  // YENİ: okuma çubuğu (0-100) ve şu an ekranda olan bölüm
  readingProgress = 0;
  activeSectionId = '';

  ngOnInit(): void {
    this.loadBlog();
  }

  loadBlog() {
    // Adresteki :id → /admin/blogs/abc-123 → "abc-123"
    const id = this.route.snapshot.paramMap.get('id');

    this.isLoading = true;
    this.errorMessage = '';

    this.blogService.getById(id).subscribe({
      next: result => {
        this.blog = result.data;
        this.wordCount = this.countWords(result.data);
        this.readingMinutes = Math.max(1, Math.round(this.wordCount / 200));   // dakikada ~200 kelime
        this.sections = [
          { id: 'bolum-1', no: '01', title: result.data.title1 },
          { id: 'bolum-2', no: '02', title: result.data.title2 },
          { id: 'bolum-3', no: '03', title: result.data.title3 }
        ];
        this.isLoading = false;
      },
      error: err => {
        this.isLoading = false;
        this.errorMessage = err.status === 404
          ? "Bu blog bulunamadı. Silinmiş olabilir."
          : err.error?.errors?.[0]?.errorMessage ?? "Blog yüklenemedi.";
      }
    });
  }

  // Bütün metinlerdeki kelime sayısı
  private countWords(blog: BlogDto): number {
    const text = [
      blog.mainDescription, blog.description1, blog.description2,
      blog.description3, blog.description4
    ].join(' ');

    // split(/\s+/): boşluklardan böl → kelimeler. filter: boşları at
    return text.trim().split(/\s+/).filter(word => word).length;
  }

  // ---------------------------------------------------------------
  // YENİ: SAYFA KAYDIRILDIKÇA
  // @HostListener('window:scroll'): pencere her kaydırıldığında bu metot çalışır
  // (C#'ta bir event'e abone olmak gibi: window.Scroll += OnScroll)
  // ---------------------------------------------------------------
  @HostListener('window:scroll')
  onScroll() {
    const article = this.articleEl?.nativeElement;
    if (!article) return;

    // getBoundingClientRect().top: yazının üst kenarının ekranın üstüne uzaklığı
    // (aşağı kaydırdıkça eksiye düşer)
    const rect = article.getBoundingClientRect();
    const scrollable = article.offsetHeight - window.innerHeight;   // yazıda kaydırılabilecek toplam yol
    const scrolled = -rect.top;                                     // şimdiye kadar kaydırılan

    // Yüzdeyi 0 ile 100 arasında tut
    this.readingProgress = scrollable > 0
      ? Math.min(100, Math.max(0, (scrolled / scrollable) * 100))
      : 100;

    // Şu an hangi bölümdeyiz? Üst kenarı ekranın üstünden 140px aşağıyı geçmiş SON bölüm
    let current = '';
    for (const section of this.sections) {
      const element = document.getElementById(section.id);
      if (element && element.getBoundingClientRect().top <= 140) {
        current = section.id;
      }
    }
    this.activeSectionId = current;
  }

  // İçindekiler'den bir bölüme yumuşakça kaydır
  // (href="#..." kullanmıyoruz: Angular'da adres değişip ana sayfaya gidebiliyor)
  scrollTo(sectionId: string) {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // YENİ: "Başa dön"
  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ---------------------------------------------------------------
  // YAZAR
  // ---------------------------------------------------------------
  get authorName(): string {
    const name = `${this.blog?.appUser?.name ?? ''} ${this.blog?.appUser?.surname ?? ''}`.trim();
    return name || 'Bilinmeyen yazar';
  }

  get authorInitials(): string {
    return this.authorName
      .split(' ')
      .filter(part => part)
      .map(part => part[0].toLocaleUpperCase('tr'))
      .slice(0, 2)
      .join('');
  }

  // ---------------------------------------------------------------
  // GERİ DÖN / DÜZENLE / SİL
  // route.parent: panel rotası ('admin' ya da 'writer') → oradan returnTo'ya git
  // ---------------------------------------------------------------
  private get returnTo(): string {
    return this.route.snapshot.data['returnTo'] ?? 'my-blogs';
  }

  get backLabel(): string {
    return this.route.snapshot.data['backLabel'] ?? 'Geri dön';
  }

  // Düzenle butonu sadece rotasında canEdit: true olan yerlerde (Bloglarım) görünür
  get canEdit(): boolean {
    return this.route.snapshot.data['canEdit'] === true;
  }

  goBack() {
    this.router.navigate([this.returnTo], { relativeTo: this.route.parent });
  }

  // /admin/my-blogs/edit/{id}  ya da  /writer/my-blogs/edit/{id}
  edit() {
    this.router.navigate([this.returnTo, 'edit', this.blog.id], { relativeTo: this.route.parent });
  }

  async deleteBlog() {
    const confirmed = await this.swal.confirm({
      title: 'Blog silinsin mi?',
      text: `"${this.blog.mainTitle}" yayından kaldırılacak.`,
      confirmText: 'Evet, sil',
      danger: true
    });
    if (!confirmed) return;

    this.blogService.delete(this.blog.id).subscribe({
      next: () => {
        this.swal.success('Blog silindi');
        this.goBack();
      },
      error: err => {
        this.swal.error('Blog silinemedi', err.error?.errors?.[0]?.errorMessage);
      }
    });
  }
}
