import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Result } from '../_models/result';
import { RoleDto } from '../_models/role';

// =====================================================================
// ROLLER (sadece Admin) → /api/roles/...
// =====================================================================
@Injectable({
  providedIn: 'root'
})
export class RoleService {

  baseUrl = "https://localhost:7200/api/roles/";

  constructor(private http: HttpClient) {}

  // GET /api/roles
  getAll() {
    return this.http.get<Result<RoleDto[]>>(this.baseUrl);
  }

  // POST /api/roles   Body: { name }
  create(name: string) {
    return this.http.post<Result<any>>(this.baseUrl, { name });
  }

  // PUT /api/roles   Body: { id, name }
  update(id: string, name: string) {
    return this.http.put<Result<any>>(this.baseUrl, { id, name });
  }

  // DELETE /api/roles/{id}
  delete(id: string) {
    return this.http.delete<Result<any>>(this.baseUrl + id);
  }

  // POST /api/roles/assign   Body: { userId, roleIds, adminPassword }
  // roleIds: kullanıcıda OLMASI GEREKEN bütün roller (listede olmayan alınır)
  // adminPassword: sadece Admin rolü veriliyorsa gerekli
  assign(userId: string, roleIds: string[], adminPassword: string | null) {
    return this.http.post<Result<any>>(this.baseUrl + 'assign', { userId, roleIds, adminPassword });
  }
}
