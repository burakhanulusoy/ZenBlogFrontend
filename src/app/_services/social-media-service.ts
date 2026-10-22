import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Result } from '../_models/result';
import { SocialMediaDto } from '../_models/site-content';

// SOSYAL MEDYA → /api/social-medias  (ekle/güncelle form-data: ikon dosyası var)
@Injectable({
  providedIn: 'root'
})
export class SocialMediaService {

  baseUrl = "https://localhost:7200/api/social-medias/";

  constructor(private http: HttpClient) {}

  getAll() {
    return this.http.get<Result<SocialMediaDto[]>>(this.baseUrl);
  }

  create(formData: FormData) {
    return this.http.post<Result<any>>(this.baseUrl, formData);
  }

  update(formData: FormData) {
    return this.http.put<Result<any>>(this.baseUrl, formData);
  }

  delete(id: string) {
    return this.http.delete<Result<any>>(this.baseUrl + id);
  }
}
