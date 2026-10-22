import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Result } from '../_models/result';
import { AboutDto } from '../_models/site-content';

// HAKKIMIZDA → /api/abouts  (ekle/güncelle form-data: 3 resim)
@Injectable({
  providedIn: 'root'
})
export class AboutService {

  baseUrl = "https://localhost:7200/api/abouts/";

  constructor(private http: HttpClient) {}

  // En yeni en üstte gelir → [0] sitede yayında olan
  getAll() {
    return this.http.get<Result<AboutDto[]>>(this.baseUrl);
  }

  getById(id: string) {
    return this.http.get<Result<AboutDto>>(this.baseUrl + id);
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
