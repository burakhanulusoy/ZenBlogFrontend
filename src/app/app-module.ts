import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';

// Layout'lar
import { AdminLayout } from './_layouts/admin-layout/admin-layout';
import { MainLayout } from './_layouts/main-layout/main-layout';
import { WriterLayout } from './_layouts/writer-layout/writer-layout';

// Ziyaretçi sitesi ve kimlik doğrulama sayfaları
import { Home } from './_main-components/home/home';
import { Login } from './_main-components/login/login';
import { Register } from './_main-components/register/register';
import { VerifyEmail } from './_main-components/verify-email/verify-email';
import { ForgotPassword } from './_main-components/forgot-password/forgot-password';

// Admin paneli sayfaları
import { Dashboard } from './_admin-components/dashboard/dashboard';
import { Category } from './_admin-components/category/category';

// Yazar paneli sayfaları
import { WriterDashboard } from './_writer-components/writer-dashboard/writer-dashboard';
import { MyBlogs } from './_personal-components/my-blogs/my-blogs';
// Ortak component'ler
import { Turnstile } from './_shared-components/turnstile/turnstile';

// Interceptor
import { TokenInterceptor } from './_interceptors/token-interceptor';

@NgModule({
  declarations: [
    App,

    // Layout'lar (<router-outlet> kullandıkları için burada olmalılar)
    AdminLayout,
    MainLayout,
    WriterLayout,

    // Ziyaretçi ve kimlik doğrulama
    Home,
    Login,
    Register,
    VerifyEmail,
    ForgotPassword,

    // Admin
    Dashboard,
    Category,

    // Yazar
    WriterDashboard,

    // Ortak
    Turnstile,
    MyBlogs
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,   // <router-outlet>, routerLink, routerLinkActive buradan geliyor
    FormsModule         // ngModel, ngForm buradan geliyor
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptorsFromDi()),
    { provide: HTTP_INTERCEPTORS, useClass: TokenInterceptor, multi: true }
  ],
  bootstrap: [App]
})
export class AppModule { }
