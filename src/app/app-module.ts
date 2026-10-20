import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { AdminLayout } from './_layouts/admin-layout/admin-layout';
import { MainLayout } from './_layouts/main-layout/main-layout';
import { Home } from './_main-components/home/home';
import { Category } from './_admin-components/category/category';
import { FormsModule } from '@angular/forms';
import { Login } from './_main-components/login/login';
import { TokenInterceptor } from './_interceptors/token-interceptor';
import { Register } from './_main-components/register/register';
import { VerifyEmail } from './_main-components/verify-email/verify-email';


@NgModule({
  declarations: [
    App,
    AdminLayout,   // <router-outlet> kullandığı için burada olmalı
    MainLayout,    // <router-outlet> kullandığı için burada olmalı
    Home,
    Category,
    Login,
    Register,
    VerifyEmail
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,   // <router-outlet>'i tanıtan modül,
    FormsModule
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptorsFromDi()),
      { provide: HTTP_INTERCEPTORS, useClass: TokenInterceptor, multi: true }

  ],
  bootstrap: [App]
})
export class AppModule { }
