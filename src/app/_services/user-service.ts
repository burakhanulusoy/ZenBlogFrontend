import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Result } from '../_models/result';
import { CloseAccountResultDto, MyProfileDto, TokenResultDto, UserDetailDto, UserListDto } from '../_models/user';

// =====================================================================
// KULLANICI YÖNETİMİ (Admin) → /api/users/...
// Not: Giriş/kayıt işlemleri AuthService'te; burası sadece yönetim işleri.
// =====================================================================
@Injectable({
  providedIn: 'root'
})
export class UserService {

  baseUrl = "https://localhost:7200/api/users/";

  constructor(private http: HttpClient) {}

  // GET /api/users
  getAll() {
    return this.http.get<Result<UserListDto[]>>(this.baseUrl);
  }

  // GET /api/users/{id}
  getById(id: string) {
    return this.http.get<Result<UserDetailDto>>(this.baseUrl + id);
  }

  // POST /api/users/{id}/block  (form-data: Reason, Evidence)
  // FormData verince Content-Type'ı HttpClient kendisi ayarlar (boundary dahil)
  block(id: string, formData: FormData) {
    return this.http.post<Result<any>>(`${this.baseUrl}${id}/block`, formData);
  }

  // POST /api/users/{id}/unblock  Body: { reason }
  unblock(id: string, reason: string) {
    return this.http.post<Result<any>>(`${this.baseUrl}${id}/unblock`, { reason });
  }

  // ---------------------------------------------------------------
  // YENİ: HESABIM (giriş yapmış herkes) → /api/users/me
  // Kim olduğu token'dan bulunuyor; Id göndermiyoruz.
  // ---------------------------------------------------------------

  // GET /api/users/me
  getMe() {
    return this.http.get<Result<MyProfileDto>>(this.baseUrl + 'me');
  }

  // PUT /api/users/me (form-data) → cevapta yeni token
  updateMe(formData: FormData) {
    return this.http.put<Result<TokenResultDto>>(this.baseUrl + 'me', formData);
  }

  // POST /api/users/me/close → 30 günlük kapanış süreci
  closeMe(currentPassword: string) {
    return this.http.post<Result<CloseAccountResultDto>>(this.baseUrl + 'me/close', { currentPassword });
  }

}
