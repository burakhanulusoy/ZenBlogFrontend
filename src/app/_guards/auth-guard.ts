import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, GuardResult, MaybeAsync, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../_services/auth-service';

declare const alertify: any;

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

    // 2) DEĞİŞTİ: Rotanın izin verdiği roller (app-routing-module'de data: { roles: [...] })
    //    Rotada rol yazılmamışsa giriş yapmış olmak yeterli.
    const allowedRoles: string[] = route.data?.['roles'] ?? [];

    if (allowedRoles.length === 0 || this.authService.hasAnyRole(allowedRoles)) {
      return true;
    }

    // 3) Yetkisi yok → kendi paneline gönder (örn. User'ı /admin'den /account'a)
    alertify.error("Bu sayfaya erişim yetkiniz yok.");
    this.router.navigate([this.authService.getHomeRoute()]);
    return false;
  }

}
