import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Result } from '../_models/result';
import { HomeBlogDto } from '../_models/home';                                         // YENİ
import { HttpParams } from '@angular/common/http';                                     // YENİ
import { BlogCommentDto, CategoryPageDto, SiteBlogDto } from '../_models/site-blog';
// =====================================================================
// ZİYARETÇİ SİTESİ: blog okuma + yorumlar + yanıtlar
// (Paneldeki BlogService yazma işleri içindi; sitenin okuma işleri burada)
// =====================================================================
@Injectable({
  providedIn: 'root'
})
export class SiteBlogService {

  private api = "https://localhost:7200/api/";

  constructor(private http: HttpClient) {}

  // ---------- BLOG ----------
  getById(id: string) {
    return this.http.get<Result<SiteBlogDto>>(`${this.api}blogs/${id}`);
  }

    // YENİ: okunmayı say (günlük tekil; backend aynı kişiyi gün içinde bir kez sayar)
  recordView(blogId: string) {
    return this.http.post<void>(`${this.api}blogs/${blogId}/view`, {});
  }

  // YENİ: ilgili yazılar (aynı kategoriden)
  getRelated(blogId: string, count = 3) {
    return this.http.get<Result<HomeBlogDto[]>>(`${this.api}blogs/${blogId}/related`, {
      params: new HttpParams().set('count', count)
    });
  }

  // YENİ: kategori sayfası (sayfalı)
  // HttpParams: ?page=2&pageSize=9 kısmını güvenli şekilde oluşturur
  getCategoryPage(categoryId: string, page: number, pageSize = 9) {
    return this.http.get<Result<CategoryPageDto>>(`${this.api}categories/${categoryId}/blogs`, {
      params: new HttpParams().set('page', page).set('pageSize', pageSize)
    });
  }
  // ---------- YORUMLAR ----------
  getComments(blogId: string) {
    return this.http.get<Result<BlogCommentDto[]>>(`${this.api}comments/byBlogId/${blogId}`);
  }

  addComment(blogId: string, body: string) {
    return this.http.post<Result<any>>(`${this.api}comments`, { blogId, body });
  }

  updateComment(id: string, body: string) {
    return this.http.put<Result<any>>(`${this.api}comments`, { id, body });
  }

  deleteComment(id: string) {
    return this.http.delete<Result<any>>(`${this.api}comments/${id}`);
  }

  // ---------- YANITLAR (alt yorumlar) ----------
  addReply(commentId: string, body: string) {
    return this.http.post<Result<any>>(`${this.api}subcomments`, { commentId, body });
  }

  updateReply(id: string, body: string) {
    return this.http.put<Result<any>>(`${this.api}subcomments`, { id, body });
  }

  deleteReply(id: string) {
    return this.http.delete<Result<any>>(`${this.api}subcomments/${id}`);
  }
}
