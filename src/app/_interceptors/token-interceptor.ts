import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, throwError } from 'rxjs';

declare const alertify: any;

@Injectable()
export class TokenInterceptor implements HttpInterceptor {

  // DİKKAT: Burada AuthService'i KULLANMIYORUZ.
  // AuthService HttpClient kullanıyor, HttpClient de bu interceptor'ı kullanıyor;
  // birbirini isteyen iki servis "döngüsel bağımlılık" (circular dependency) hatası verir.
  constructor(private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    const token = localStorage.getItem("token");

    // Token varsa isteğin bir kopyasını alıp başlığına ekliyoruz.
    // (İstekler değiştirilemez; o yüzden clone ile kopyalanıyor.)
    const request = token
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

    return next.handle(request).pipe(
      catchError((err: HttpErrorResponse) => {

        // 401: token geçersiz ya da süresi dolmuş → oturumu kapat, login'e gönder
        if (err.status === 401 && token) {
          localStorage.removeItem("token");
          alertify.error("Oturum süren doldu, lütfen tekrar giriş yap.");
          this.router.navigate(["/login"]);
        }

        // Hatayı component'e de iletiyoruz ki kendi error bloğu da çalışsın
        return throwError(() => err);
      })
    );
  }
}
