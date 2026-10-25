import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SiteBlogService } from '../../_services/site-blog-service';
import { AuthService } from '../../_services/auth-service';
import { SweetAlert } from '../../_services/sweet-alert';
import { BlogCommentDto, BlogReplyDto, SiteBlogDto } from '../../_models/site-blog';
import { HomeBlogDto } from '../../_models/home';

// =====================================================================
// SİTE: BLOG DETAYI (ziyaretçinin okuduğu sayfa)  →  /blog/:id
// Yazı + yazar + paylaşım + yorumlar ve yanıtlar.
// Yorum yazmak için giriş şart; giriş yapınca returnUrl ile bu sayfaya dönülür.
//
// ÖNEMLİ: Adresteki Id'yi snapshot yerine paramMap aboneliğiyle okuyoruz.
// Bir blogdan diğerine geçince Angular component'i YENİDEN OLUŞTURMAZ, aynısını kullanır;
// snapshot ile okusaydık adres değişir ama sayfada eski blog kalırdı.
// =====================================================================
@Component({
  selector: 'app-site-blog-detail',
  standalone: false,
  templateUrl: './site-blog-detail.html',
  styleUrl: './site-blog-detail.css'
})
export class SiteBlogDetail implements OnInit, OnDestroy {

  constructor(private route: ActivatedRoute,
              private router: Router,
              private siteBlogService: SiteBlogService,
              public authService: AuthService,
              private swal: SweetAlert) {}

  blog: SiteBlogDto | null = null;
  comments: BlogCommentDto[] = [];
  totalComments = 0;   // yorum + yanıt (yorumlar yüklenince BİR KEZ hesaplanır)
  related: HomeBlogDto[] = [];   // YENİ: ilgili yazılar

  isLoading = true;
  notFound = false;
  errorMessage = '';
  readMinutes = 1;
  readingProgress = 0;

  readonly maxLength = 1000;

  // YENİ YORUM
  newComment = '';
  isSending = false;

  // YANIT
  replyingTo: string | null = null;   // hangi yorumun altına yanıt yazılıyor
  replyText = '';
  isReplying = false;

  // DÜZENLEME (yorum ya da yanıt)
  editingId: string | null = null;
  editingIsReply = false;
  editText = '';
  isSavingEdit = false;

  private subscriptions = new Subscription();

  ngOnInit(): void {
    this.subscriptions.add(
      this.route.paramMap.subscribe(params => this.load(params.get('id')))
    );
  }

  // ---------------------------------------------------------------
  // YÜKLE
  // ---------------------------------------------------------------
  load(id: string | null) {
    if (!id) return;

    this.isLoading = true;
    this.notFound = false;
    this.errorMessage = '';
    this.blog = null;
    this.comments = [];
        this.related = [];   // YENİ
    this.totalComments = 0;
    this.resetForms();

    this.siteBlogService.getById(id).subscribe({
      next: result => {
        this.blog = result.data;
        this.readMinutes = this.calculateReadMinutes(result.data);
        this.isLoading = false;
        this.loadComments();
                this.loadRelated();   // YENİ
                        // YENİ: okunmayı say. Sonucu beklemiyoruz; hata olsa bile okuyucu etkilenmesin.
        this.siteBlogService.recordView(result.data.id).subscribe({ error: () => {} });
      },
      error: err => {
        this.isLoading = false;
        if (err.status === 404) {
          this.notFound = true;
        } else {
          this.errorMessage = "Yazı şu anda yüklenemedi. Lütfen biraz sonra tekrar dene.";
        }
      }
    });
  }

  loadComments() {
    if (!this.blog) return;

    this.siteBlogService.getComments(this.blog.id).subscribe({
      next: result => {
        this.comments = result.data ?? [];
        this.totalComments = this.comments.reduce((sum, c) => sum + 1 + c.replies.length, 0);
      }
    });
  }

  // YENİ: aynı kategoriden 3 yazı (hata olursa bölüm sessizce gizli kalır)
  loadRelated() {
    if (!this.blog) return;
    this.siteBlogService.getRelated(this.blog.id, 3).subscribe({
      next: result => this.related = result.data ?? [],
      error: () => this.related = []
    });
  }

  // Ortalama okuma hızı dakikada ~200 kelime
  private calculateReadMinutes(b: SiteBlogDto): number {
    const text = [b.mainDescription, b.description1, b.description2, b.description3, b.description4].join(' ');
    const words = text.trim().split(/\s+/).length;
    return Math.max(1, Math.round(words / 200));
  }

  // ---------------------------------------------------------------
  // OKUMA İLERLEME ÇUBUĞU
  // ---------------------------------------------------------------
  @HostListener('window:scroll')
  onScroll() {
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    this.readingProgress = max > 0 ? Math.min(100, (doc.scrollTop / max) * 100) : 0;
  }

  // ---------------------------------------------------------------
  // KULLANICI BİLGİLERİ
  // ---------------------------------------------------------------
  get isLoggedIn(): boolean {
    return this.authService.loggedIn();
  }

  get currentUserId(): string {
    return this.authService.getUserId();
  }

  get currentUserImage(): string {
    return this.authService.getImageUrl();
  }

  get currentUserInitials(): string {
    return this.initials(this.authService.getFullName());
  }

  get authorName(): string {
    return `${this.blog?.appUser?.name ?? ''} ${this.blog?.appUser?.surname ?? ''}`.trim();
  }

  // Giriş sayfasına giderken buraya dönülsün
  get returnUrlParams() {
    return { returnUrl: this.router.url };
  }

  isOwner(authorId: string): boolean {
    return this.isLoggedIn && authorId === this.currentUserId;
  }

  // Silme: sahibi, blogun yazarı ya da Admin (backend de aynı kuralı uyguluyor)
  canDelete(authorId: string): boolean {
    if (!this.isLoggedIn) return false;
    return authorId === this.currentUserId
        || this.blog?.appUserId === this.currentUserId
        || this.authService.hasAnyRole(['Admin']);
  }

  isBlogAuthor(authorId: string): boolean {
    return authorId === this.blog?.appUserId;
  }

  // Yazıldıktan 1 dakikadan fazla sonra güncellendiyse "(düzenlendi)"
  isEdited(item: BlogReplyDto): boolean {
    if (!item.updatedAt) return false;
    return new Date(item.updatedAt).getTime() - new Date(item.createdAt).getTime() > 60_000;
  }

  initials(name: string): string {
    return (name ?? '').split(' ').filter(p => p).map(p => p[0].toLocaleUpperCase('tr')).slice(0, 2).join('');
  }

  // ---------------------------------------------------------------
  // YORUM YAZ
  // ---------------------------------------------------------------
  submitComment() {
    const body = this.newComment.trim();
    if (!body || !this.blog) return;

    this.isSending = true;
    this.siteBlogService.addComment(this.blog.id, body).subscribe({
      next: () => {
        this.isSending = false;
        this.newComment = '';
        this.swal.success('Yorumun yayınlandı');
        this.loadComments();
      },
      error: err => {
        this.isSending = false;
        this.swal.error('Yorum gönderilemedi', err.error?.errors?.[0]?.errorMessage);
      }
    });
  }

  // ---------------------------------------------------------------
  // YANITLA (yanıta yanıt da aynı yorumun altına gider, başına @Ad eklenir)
  // ---------------------------------------------------------------
  startReply(comment: BlogCommentDto, mention?: BlogReplyDto) {
    this.cancelEdit();
    this.replyingTo = comment.id;
    this.replyText = mention ? `@${mention.authorName} ` : '';
  }

  cancelReply() {
    this.replyingTo = null;
    this.replyText = '';
  }

  submitReply(comment: BlogCommentDto) {
    const body = this.replyText.trim();
    if (!body) return;

    this.isReplying = true;
    this.siteBlogService.addReply(comment.id, body).subscribe({
      next: () => {
        this.isReplying = false;
        this.cancelReply();
        this.loadComments();
      },
      error: err => {
        this.isReplying = false;
        this.swal.error('Yanıt gönderilemedi', err.error?.errors?.[0]?.errorMessage);
      }
    });
  }

  // ---------------------------------------------------------------
  // DÜZENLE
  // ---------------------------------------------------------------
  startEdit(item: BlogReplyDto, isReply: boolean) {
    this.cancelReply();
    this.editingId = item.id;
    this.editingIsReply = isReply;
    this.editText = item.body;
  }

  cancelEdit() {
    this.editingId = null;
    this.editText = '';
  }

  saveEdit() {
    const body = this.editText.trim();
    if (!body || !this.editingId) return;

    this.isSavingEdit = true;
    const request = this.editingIsReply
      ? this.siteBlogService.updateReply(this.editingId, body)
      : this.siteBlogService.updateComment(this.editingId, body);

    request.subscribe({
      next: () => {
        this.isSavingEdit = false;
        this.cancelEdit();
        this.loadComments();
      },
      error: err => {
        this.isSavingEdit = false;
        this.swal.error('Kaydedilemedi', err.error?.errors?.[0]?.errorMessage);
      }
    });
  }

  // ---------------------------------------------------------------
  // SİL
  // ---------------------------------------------------------------
  async deleteItem(item: BlogReplyDto, isReply: boolean) {
    const confirmed = await this.swal.confirm({
      title: isReply ? 'Yanıt silinsin mi?' : 'Yorum silinsin mi?',
      text: isReply ? 'Bu yanıt kaldırılacak.' : 'Bu yorum ve altındaki bütün yanıtlar kaldırılacak.',
      confirmText: 'Evet, sil',
      danger: true
    });
    if (!confirmed) return;

    const request = isReply
      ? this.siteBlogService.deleteReply(item.id)
      : this.siteBlogService.deleteComment(item.id);

    request.subscribe({
      next: () => {
        this.swal.success(isReply ? 'Yanıt silindi' : 'Yorum silindi');
        this.loadComments();
      },
      error: err => this.swal.error('Silinemedi', err.error?.errors?.[0]?.errorMessage)
    });
  }

  private resetForms() {
    this.newComment = '';
    this.cancelReply();
    this.cancelEdit();
  }

  // ---------------------------------------------------------------
  // PAYLAŞ
  // ---------------------------------------------------------------
  get pageUrl(): string {
    return window.location.href;
  }

  shareLink(platform: 'x' | 'linkedin' | 'whatsapp'): string {
    const url = encodeURIComponent(this.pageUrl);
    const title = encodeURIComponent(this.blog?.mainTitle ?? '');
    switch (platform) {
      case 'x': return `https://x.com/intent/post?url=${url}&text=${title}`;
      case 'linkedin': return `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
      case 'whatsapp': return `https://wa.me/?text=${title}%20${url}`;
    }
  }

  async copyLink() {
    try {
      await navigator.clipboard.writeText(this.pageUrl);
      this.swal.success('Bağlantı kopyalandı');
    } catch {
      this.swal.error('Kopyalanamadı', 'Adres çubuğundan kopyalayabilirsin.');
    }
  }

  trackById(_: number, item: { id: string }) {
    return item.id;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
