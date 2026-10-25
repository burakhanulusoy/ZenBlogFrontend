import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Result } from '../_models/result';
import { CommentManageDto } from '../_models/comment-manage';

// =====================================================================
// PANEL YORUM SAYFALARI
// Listeleme uçları yeni; düzenleme/silme mevcut yorum ve yanıt uçlarını kullanıyor
// (sahiplik kuralları backend'de: sahibi düzenler; sahibi, blog yazarı ya da admin siler)
// =====================================================================
@Injectable({
  providedIn: 'root'
})
export class CommentManageService {

  private api = "https://localhost:7200/api/";

  constructor(private http: HttpClient) {}

  getMine() {
    return this.http.get<Result<CommentManageDto[]>>(`${this.api}comments/mine`);
  }

  getOnMyBlogs() {
    return this.http.get<Result<CommentManageDto[]>>(`${this.api}comments/on-my-blogs`);
  }

  getAll() {
    return this.http.get<Result<CommentManageDto[]>>(`${this.api}comments/all`);
  }

  // Yorum ya da yanıt → doğru uca gider
  update(item: CommentManageDto, body: string) {
    const url = item.isReply ? `${this.api}subcomments` : `${this.api}comments`;
    return this.http.put<Result<any>>(url, { id: item.id, body });
  }

  delete(item: CommentManageDto) {
    const url = item.isReply ? `${this.api}subcomments/${item.id}` : `${this.api}comments/${item.id}`;
    return this.http.delete<Result<any>>(url);
  }
}
