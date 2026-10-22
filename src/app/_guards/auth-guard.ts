import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, GuardResult, MaybeAsync, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../_services/auth-service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService,
              private router: Router) {}

  // Rota açılmadan ÖNCE çalışır.
  // true → sayfa açılır. UrlTree → Angular o adrese yönlendirir.
  // (createUrlTree: "şu adrese git" bilgisini döndürmek; navigate + return false'un daha temiz hali)
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): MaybeAsync<GuardResult> {

    // 1) Giriş yapılmamış ya da token süresi dolmuş → login'e
    if (!this.authService.loggedIn()) {
      return this.router.createUrlTree(["/login"]);
    }

    // 2) Rotanın izin verdiği roller (app-routing-module'de data: { roles: [...] })
    //    Rotada rol yazılmamışsa giriş yapmış olmak yeterli.
    const allowedRoles: string[] = route.data?.['roles'] ?? [];

    if (allowedRoles.length === 0 || this.authService.hasAnyRole(allowedRoles)) {
      return true;
    }

    // 3) DEĞİŞTİ: Yetkisi yok → 403 sayfası (eskiden bildirim gösterip kendi paneline atıyordu)
    return this.router.createUrlTree(["/forbidden"]);
  }
}
