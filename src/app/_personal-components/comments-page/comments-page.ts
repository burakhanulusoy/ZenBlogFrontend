import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { CommentManageService } from '../../_services/comment-manage-service';
import { SweetAlert } from '../../_services/sweet-alert';
import { Result } from '../../_models/result';
import { CommentManageDto, CommentsPageMode } from '../../_models/comment-manage';

type TypeFilter = 'all' | 'comment' | 'reply';

// Her modun başlığı, açıklaması ve boş durum metni
const MODE_TEXTS: Record<CommentsPageMode, { title: string; sub: string; empty: string; icon: string }> = {
  mine: {
    title: 'Yorumlarım',
    sub: 'Sitedeki bloglara yazdığın yorum ve yanıtlar.',
    empty: 'Henüz bir yorum yazmadın. Bir yazıyı oku ve düşünceni paylaş!',
    icon: 'pi pi-comment'
  },
  onMyBlogs: {
    title: 'Gelen yorumlar',
    sub: 'Bloglarına okurların yazdığı yorum ve yanıtlar. Uygunsuz olanları silebilirsin.',
    empty: 'Bloglarına henüz yorum gelmedi.',
    icon: 'pi pi-inbox'
  },
  all: {
    title: 'Tüm yorumlar',
    sub: 'Sitedeki bütün yorum ve yanıtlar (en yeni 500). Topluluk kurallarına aykırı olanları silebilirsin.',
    empty: 'Sitede henüz yorum yok.',
    icon: 'pi pi-comments'
  }
};

// =====================================================================
// YORUM SAYFALARI (ortak: admin, writer, user)
// Hangi sayfa olduğu rotadaki data.mode'dan gelir:
//   mine      → Yorumlarım (düzenle + sil)
//   onMyBlogs → Gelen yorumlar (sil: blog yazarı olarak)
//   all       → Tüm yorumlar (sil: admin olarak)
// Görünüm: admin'de sade, writer/user'da piksel (CSS → :host-context(.zb-pixel))
// =====================================================================
@Component({
  selector: 'app-comments-page',
  standalone: false,
  templateUrl: './comments-page.html',
  styleUrl: './comments-page.css'
})
export class CommentsPage implements OnInit {

  constructor(private route: ActivatedRoute,
              private commentService: CommentManageService,
              private swal: SweetAlert) {}

  mode: CommentsPageMode = 'mine';
  texts = MODE_TEXTS.mine;

  items: CommentManageDto[] = [];
  filtered: CommentManageDto[] = [];
  visible: CommentManageDto[] = [];   // ekranda görünenler ("Daha fazla göster" ile artar)

  commentCount = 0;
  replyCount = 0;

  searchText = '';
  typeFilter: TypeFilter = 'all';
  readonly pageSize = 10;
  private visibleCount = this.pageSize;

  isLoading = true;
  errorMessage = '';

  // Düzenleme (sadece "Yorumlarım")
  editingId: string | null = null;
  editText = '';
  isSaving = false;
  readonly maxLength = 1000;

  ngOnInit(): void {
    this.mode = this.route.snapshot.data['mode'] ?? 'mine';
    this.texts = MODE_TEXTS[this.mode];
    this.load();
  }

  load() {
    this.isLoading = true;
    this.errorMessage = '';

    const request: Observable<Result<CommentManageDto[]>> =
      this.mode === 'all' ? this.commentService.getAll()
      : this.mode === 'onMyBlogs' ? this.commentService.getOnMyBlogs()
      : this.commentService.getMine();

    request.subscribe({
      next: result => {
        this.items = result.data ?? [];
        this.commentCount = this.items.filter(i => !i.isReply).length;
        this.replyCount = this.items.filter(i => i.isReply).length;
        this.visibleCount = this.pageSize;
        this.applyFilter();
        this.isLoading = false;
      },
      error: err => {
        this.isLoading = false;
        this.errorMessage = err.error?.errors?.[0]?.errorMessage ?? 'Yorumlar yüklenemedi.';
      }
    });
  }

  // ---------------------------------------------------------------
  // ARAMA + FİLTRE (listeler BİR KEZ hesaplanır, şablonda yeni dizi üretilmez)
  // ---------------------------------------------------------------
  onSearch(value: string) {
    this.searchText = value;
    this.visibleCount = this.pageSize;
    this.applyFilter();
  }

  setType(type: TypeFilter) {
    this.typeFilter = type;
    this.visibleCount = this.pageSize;
    this.applyFilter();
  }

  private applyFilter() {
    const q = this.searchText.trim().toLocaleLowerCase('tr');

    this.filtered = this.items.filter(i =>
      (this.typeFilter === 'all' || (this.typeFilter === 'reply') === i.isReply) &&
      (!q || i.body.toLocaleLowerCase('tr').includes(q)
          || i.blogTitle.toLocaleLowerCase('tr').includes(q)
          || i.authorName.toLocaleLowerCase('tr').includes(q)));

    this.updateVisible();
  }

  private updateVisible() {
    this.visible = this.filtered.slice(0, this.visibleCount);
  }

  showMore() {
    this.visibleCount += this.pageSize;
    this.updateVisible();
  }

  get hasMore(): boolean {
    return this.visible.length < this.filtered.length;
  }

  // ---------------------------------------------------------------
  // GÖRÜNÜM
  // ---------------------------------------------------------------
  get showAuthor(): boolean {
    return this.mode !== 'mine';   // "Yorumlarım"da yazar zaten sensin
  }

  get canEdit(): boolean {
    return this.mode === 'mine';   // sadece kendi yorumunu düzenleyebilirsin
  }

  isEdited(item: CommentManageDto): boolean {
    if (!item.updatedAt) return false;
    return new Date(item.updatedAt).getTime() - new Date(item.createdAt).getTime() > 60_000;
  }

  initials(name: string): string {
    return (name ?? '').split(' ').filter(p => p).map(p => p[0].toLocaleUpperCase('tr')).slice(0, 2).join('');
  }

  trackById(_: number, item: CommentManageDto) {
    return item.id;
  }

  // ---------------------------------------------------------------
  // DÜZENLE (Yorumlarım)
  // ---------------------------------------------------------------
  startEdit(item: CommentManageDto) {
    this.editingId = item.id;
    this.editText = item.body;
  }

  cancelEdit() {
    this.editingId = null;
    this.editText = '';
  }

  saveEdit(item: CommentManageDto) {
    const body = this.editText.trim();
    if (!body) return;

    this.isSaving = true;
    this.commentService.update(item, body).subscribe({
      next: () => {
        this.isSaving = false;
        // Listeyi yeniden yüklemeden güncelle
        item.body = body;
        item.updatedAt = new Date(Date.now() + 120_000).toISOString();   // "(düzenlendi)" hemen görünsün
        this.cancelEdit();
        this.swal.success('Yorum güncellendi');
      },
      error: err => {
        this.isSaving = false;
        this.swal.error('Kaydedilemedi', err.error?.errors?.[0]?.errorMessage);
      }
    });
  }

  // ---------------------------------------------------------------
  // SİL
  // ---------------------------------------------------------------
  async deleteItem(item: CommentManageDto) {
    const confirmed = await this.swal.confirm({
      title: item.isReply ? 'Yanıt silinsin mi?' : 'Yorum silinsin mi?',
      text: !item.isReply && item.replyCount > 0
        ? `Bu yorum ve altındaki ${item.replyCount} yanıt kaldırılacak.`
        : 'Bu işlem geri alınamaz.',
      confirmText: 'Evet, sil',
      danger: true
    });
    if (!confirmed) return;

    this.commentService.delete(item).subscribe({
      next: () => {
        this.swal.success(item.isReply ? 'Yanıt silindi' : 'Yorum silindi');
        this.load();   // yorum silinince yanıtları da gittiği için listeyi yenile
      },
      error: err => this.swal.error('Silinemedi', err.error?.errors?.[0]?.errorMessage)
    });
  }
}
