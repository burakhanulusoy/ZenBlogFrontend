import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Result } from '../_models/result';
import { BlogListDto } from '../_models/blogListDto';
import { BlogDto } from '../_models/blog';   // YENİ

@Injectable({
  providedIn: 'root'
})
export class BlogService {

  baseUrl = "https://localhost:7200/api/blogs/";

  constructor(private http: HttpClient) {}

  // GET /api/blogs/my → giriş yapan kişinin kendi blogları
  // (token'ı interceptor ekliyor; backend Id'yi token'dan okuyor)
  getMyBlogs() {
    return this.http.get<Result<BlogListDto[]>>(this.baseUrl + "my");
  }

  // YENİ: GET /api/blogs/{id} → tek blog (düzenleme formunu doldurmak için)
  getById(id: string) {
    return this.http.get<Result<BlogDto>>(this.baseUrl + id);
  }

  // YENİ: POST /api/blogs → yeni blog
  // JSON değil FORM-DATA gönderiyoruz, çünkü içinde dosya (resim) var.
  // FormData'yı verince HttpClient Content-Type'ı KENDİSİ "multipart/form-data; boundary=..."
  // olarak ayarlar. Elle Content-Type yazarsak "boundary" eksik kalır ve backend formu okuyamaz.
  // Backend'de [FromForm] CreateBlogCommand karşılıyor; yazar token'dan geliyor.
  create(formData: FormData) {
    return this.http.post<Result<any>>(this.baseUrl, formData);
  }

  // YENİ: PUT /api/blogs → güncelleme (form-data; içinde "Id" de var)
  // Seçilmeyen resimler gönderilmez, backend eskisini korur.
  update(formData: FormData) {
    return this.http.put<Result<any>>(this.baseUrl, formData);
  }

  // DELETE /api/blogs/{id}  (backend soft delete yapıyor; resimler Azure'da korunuyor)
  delete(id: string) {
    return this.http.delete(this.baseUrl + id);
  }

  // YENİ: GET /api/blogs → sitedeki bütün bloglar (admin "Tüm bloglar" sayfası)
  getAll() {
    return this.http.get<Result<BlogListDto[]>>(this.baseUrl);
  }

}
