import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Result } from '../_models/result';
import {
  MyWriterApplicationDto, SubmitWriterApplicationDto,
  WriterApplicationDetailDto, WriterApplicationListItemDto
} from '../_models/writer-application';

// =====================================================================
// YAZARLIK BAŞVURULARI
//   Kullanıcı: /api/users/me/writer-application  (kendi başvurusu)
//   Admin:     /api/writer-applications/...
// =====================================================================
@Injectable({
  providedIn: 'root'
})
export class WriterApplicationService {

  private meUrl = "https://localhost:7200/api/users/me/writer-application";
  private adminUrl = "https://localhost:7200/api/writer-applications/";

  constructor(private http: HttpClient) {}

  // ---------- KULLANICI ----------
  getMine() {
    return this.http.get<Result<MyWriterApplicationDto>>(this.meUrl);
  }

  submit(dto: SubmitWriterApplicationDto) {
    return this.http.post<Result<any>>(this.meUrl, dto);
  }

  // ---------- ADMİN ----------
  getAll() {
    return this.http.get<Result<WriterApplicationListItemDto[]>>(this.adminUrl);
  }

  getPendingCount() {
    return this.http.get<Result<number>>(this.adminUrl + 'pending-count');
  }

  // Açılınca backend "okundu" işaretler
  getById(id: string) {
    return this.http.get<Result<WriterApplicationDetailDto>>(this.adminUrl + id);
  }

  approve(id: string) {
    return this.http.post<Result<any>>(`${this.adminUrl}${id}/approve`, {});
  }

  reject(id: string, reason: string) {
    return this.http.post<Result<any>>(`${this.adminUrl}${id}/reject`, { reason });
  }
}
