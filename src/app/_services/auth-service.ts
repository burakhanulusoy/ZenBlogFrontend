import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { RegisterDto } from '../_models/registerDto';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  constructor(private http: HttpClient,
              private router: Router) { }

  // Kullanıcı işlemlerinin ortak adresi
  baseUrl = "https://localhost:7200/api/users/";

  decodedToken: any;
  jwtHelper = new JwtHelperService();

  // Token'daki rol alanının adı (backend rolü ClaimTypes.Role ile ekliyor)
  private readonly roleClaim = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

  // POST /api/users/login
  login(model) {
    return this.http.post<any>(this.baseUrl + "login", model);
  }

  // POST /api/users/google-login   Body: { idToken }
  googleLogin(idToken: string) {
    return this.http.post<any>(this.baseUrl + "google-login", { idToken });
  }

  // POST /api/users/register
  register(model: RegisterDto) {
    return this.http.post<any>(this.baseUrl + "register", model);
  }

  // POST /api/users/confirm-email   Body: { email, code }
  confirmEmail(email: string, code: string) {
    return this.http.post<any>(this.baseUrl + "confirm-email", { email, code });
  }

  // POST /api/users/resend-confirmation   Body: { email }
  resendConfirmation(email: string) {
    return this.http.post<any>(this.baseUrl + "resend-confirmation", { email });
  }

  // YENİ: POST /api/users/forgot-password   Body: { email }
  forgotPassword(email: string) {
    return this.http.post<any>(this.baseUrl + "forgot-password", { email });
  }

  // YENİ: POST /api/users/reset-password   Body: { email, code, newPassword, confirmPassword }
  resetPassword(email: string, code: string, newPassword: string, confirmPassword: string) {
    return this.http.post<any>(this.baseUrl + "reset-password", { email, code, newPassword, confirmPassword });
  }

  decodeToken() {
    let token = localStorage.getItem("token");
    this.decodedToken = this.jwtHelper.decodeToken(token);
    return this.decodedToken;
  }

  loggedIn() {
    const token = localStorage.getItem("token");
    return !this.jwtHelper.isTokenExpired(token);
  }

  logout() {
    localStorage.removeItem("token");
    this.router.navigate(["/login"]);
  }

  // Kullanıcının rollerini dizi olarak döndürür → örn. ["Admin"] ya da ["User"]
  getRoles(): string[] {
    const token = localStorage.getItem("token");
    if (!token) return [];

    const roles = this.jwtHelper.decodeToken(token)?.[this.roleClaim];
    if (!roles) return [];

    return Array.isArray(roles) ? roles : [roles];
  }

  isAdmin(): boolean {
    return this.getRoles().includes("Admin");
  }

}
