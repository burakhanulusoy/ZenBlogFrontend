import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Result } from '../_models/result';
import { BlogListDto } from '../_models/blogListDto';

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

  // YENİ: DELETE /api/blogs/{id}  (backend soft delete yapıyor; resimler Azure'da korunuyor)
  delete(id: string) {
    return this.http.delete(this.baseUrl + id);
  }

  // Blog oluşturma ve güncelleme 2. adımda eklenecek
}
