import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

// YENİ: PrimeNG
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import { ZenPreset } from './_theme/zen-preset';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { AvatarModule } from 'primeng/avatar';
import { MenuModule } from 'primeng/menu';

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

// Ortak (kişisel) sayfalar: birden fazla panelde kullanılıyor
import { MyBlogs } from './_personal-components/my-blogs/my-blogs';
import { BlogForm } from './_personal-components/blog-form/blog-form';

// Ortak component'ler
import { Turnstile } from './_shared-components/turnstile/turnstile';

// Interceptor
import { TokenInterceptor } from './_interceptors/token-interceptor';
import { AllBlogs } from './_admin-components/all-blogs/all-blogs';
import { BlogDetail } from './_personal-components/blog-detail/blog-detail';


// YENİ: PrimeNG (tablo, açılır liste, input, ipucu, iskelet)
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { AuthShell } from './_shared-components/auth-shell/auth-shell';


import { PasswordModule } from 'primeng/password';     // YENİ: <p-password> (göster/gizle düğmeli şifre)
import { InputOtpModule } from 'primeng/inputotp';     // YENİ: <p-inputotp> (6 kutulu kod girişi)
import { ChartModule } from 'primeng/chart';   // YENİ: <p-chart> (chart.js tabanlı grafikler)
import { DialogModule } from 'primeng/dialog';
import { Users } from './_admin-components/users/users';
import { UserDetail } from './_admin-components/user-detail/user-detail';   // YENİ: <p-dialog> (açılır pencere)

import { TextareaModule } from 'primeng/textarea';
import { Profile } from './_personal-components/profile/profile';
import { UserLayout } from './_layouts/user-layout/user-layout';
import { ErrorPage } from './_main-components/error-page/error-page';
import { Roles } from './_admin-components/roles/roles';
import { BecomeWriter } from './_user-components/become-writer/become-writer';
import { WriterApplications } from './_admin-components/writer-applications/writer-applications';
import { WriterApplicationDetail } from './_admin-components/writer-application-detail/writer-application-detail';
import { SocialMedias } from './_admin-components/social-medias/social-medias';
import { Abouts } from './_admin-components/abouts/abouts';
import { AboutForm } from './_admin-components/about-form/about-form';
import { Teams } from './_admin-components/teams/teams';
import { TeamForm } from './_admin-components/team-form/team-form';
import { ContactInfo } from './_admin-components/contact-info/contact-info';
import { ContactMessages } from './_admin-components/contact-messages/contact-messages';   // YENİ: pTextarea

import { registerLocaleData } from '@angular/common';   // YENİ
import localeTr from '@angular/common/locales/tr';
import { SiteBlogDetail } from './_main-components/site-blog-detail/site-blog-detail';
import { SiteCategory } from './_main-components/site-category/site-category';
import { SiteAbout } from './_main-components/site-about/site-about';
import { SiteContact } from './_main-components/site-contact/site-contact';

registerLocaleData(localeTr);

@NgModule({
  declarations: [
    App,

    // Layout'lar (<router-outlet> kullandıkları için burada olmalılar)
    AdminLayout,
    MainLayout,
    WriterLayout,
    UserLayout,

    // Ziyaretçi ve kimlik doğrulama
    Home,
    Login,
    Register,
    VerifyEmail,
    ForgotPassword,

    // Admin
    Dashboard,
    Category,
    AllBlogs,

    // Yazar
    WriterDashboard,

    // Ortak
    Turnstile,
    MyBlogs,
    BlogForm,
    AllBlogs,
    BlogDetail,
    AuthShell,
    Users,
    UserDetail,
    Profile,
    UserLayout,
    ErrorPage,
    Roles,
    BecomeWriter,
    WriterApplications,
    WriterApplicationDetail,
    SocialMedias,
    Abouts,
    AboutForm,
    Teams,
    TeamForm,
    ContactInfo,
    ContactMessages,
    SiteBlogDetail,
    SiteCategory,
    SiteAbout,
    SiteContact,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,   // <router-outlet>, routerLink, routerLinkActive buradan geliyor
    FormsModule,        // ngModel, ngForm buradan geliyor

    // YENİ: PrimeNG bileşenleri (HTML'de kullanacağımız her bileşenin modülü burada olmalı)
    ButtonModule,       // <p-button>
    DrawerModule,       // <p-drawer>  (mobilde soldan açılan menü)
    AvatarModule,       // <p-avatar>  (baş harfli yuvarlak)
    MenuModule,          // <p-menu>    (kullanıcı açılır menüsü)

    MenuModule,         // <p-menu>    (kullanıcı açılır menüsü)
    TableModule,        // YENİ: <p-table>
    SelectModule,       // YENİ: <p-select>  (açılır liste)
    InputTextModule,    // YENİ: pInputText
    IconFieldModule,    // YENİ: <p-iconfield> (ikonlu input)
    InputIconModule,    // YENİ: <p-inputicon>
    TooltipModule,      // YENİ: pTooltip (üzerine gelince ipucu)
    SkeletonModule,      // YENİ: <p-skeleton> (yüklenirken gri kutular)
    PasswordModule,
    InputOtpModule,
    ChartModule,
        DialogModule,        // YENİ: <p-dialog>
    TextareaModule      // YENİ: pTextarea
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptorsFromDi()),
    { provide: HTTP_INTERCEPTORS, useClass: TokenInterceptor, multi: true },

    // YENİ: PrimeNG bileşenlerinin açılma/kapanma animasyonları için
    provideAnimationsAsync(),

    // YENİ: PrimeNG'nin genel ayarı: hangi tema kullanılacak
    // darkModeSelector: false → karanlık mod kapalı (Bootstrap sayfalarıyla uyumsuz görünmesin)
    providePrimeNG({
      theme: {
        preset: ZenPreset,
        options: { darkModeSelector: false }
      }
    })
  ],
  bootstrap: [App]
})
export class AppModule { }
