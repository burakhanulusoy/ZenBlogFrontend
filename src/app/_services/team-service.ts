import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Result } from '../_models/result';
import { TeamDto, TeamPlatformDto } from '../_models/team';

// =====================================================================
// EKİP → /api/teams/...
// Üye ekle/güncelle form-data (fotoğraf var), sosyal hesaplar JSON.
// =====================================================================
@Injectable({
  providedIn: 'root'
})
export class TeamService {

  baseUrl = "https://localhost:7200/api/teams/";

  constructor(private http: HttpClient) {}

  // ---------- ÜYELER ----------
  getAll() {
    return this.http.get<Result<TeamDto[]>>(this.baseUrl);
  }

  getById(id: string) {
    return this.http.get<Result<TeamDto>>(this.baseUrl + id);
  }

  getPlatforms() {
    return this.http.get<Result<TeamPlatformDto[]>>(this.baseUrl + 'platforms');
  }

  // Cevapta data = yeni üyenin Id'si
  create(formData: FormData) {
    return this.http.post<Result<string>>(this.baseUrl, formData);
  }

  update(formData: FormData) {
    return this.http.put<Result<any>>(this.baseUrl, formData);
  }

  delete(id: string) {
    return this.http.delete<Result<any>>(this.baseUrl + id);
  }

  // ---------- SOSYAL HESAPLAR ----------
  addSocial(teamId: string, socialMediaName: string, url: string) {
    return this.http.post<Result<any>>(`${this.baseUrl}${teamId}/social-medias`, { socialMediaName, url });
  }

  updateSocial(id: string, socialMediaName: string, url: string) {
    return this.http.put<Result<any>>(this.baseUrl + 'social-medias', { id, socialMediaName, url });
  }

  deleteSocial(id: string) {
    return this.http.delete<Result<any>>(this.baseUrl + 'social-medias/' + id);
  }
}
