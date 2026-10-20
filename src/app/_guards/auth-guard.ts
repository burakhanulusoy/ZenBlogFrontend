import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, GuardResult, MaybeAsync, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../_services/auth-service';

declare const alertify: any;   // YENİ: yetkisiz girişte bildirim göstermek için

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService,
              private router: Router) {}

  // Rota açılmadan ÖNCE çalışır; true dönerse sayfa açılır, false dönerse açılmaz
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): MaybeAsync<GuardResult> {

    // 1) Giriş yapılmamış ya da token süresi dolmuş → login'e
    if (!this.authService.loggedIn()) {
      this.router.navigate(["/login"]);
      return false;
    }

    // DEĞİŞTİ / YENİ: 2) Giriş yapılmış ama Admin değil → ana sayfaya
    if (!this.authService.isAdmin()) {
      alertify.error("Bu sayfaya erişim yetkiniz yok.");
      this.router.navigate(["/"]);
      return false;
    }

    return true;
  }

}
