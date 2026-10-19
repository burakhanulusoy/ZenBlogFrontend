import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { AdminLayout } from './_layouts/admin-layout/admin-layout';
import { MainLayout } from './_layouts/main-layout/main-layout';
import { Home } from './_main-components/home/home';
import { Category } from './_admin-components/category/category';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    App,
    AdminLayout,   // <router-outlet> kullandığı için burada olmalı
    MainLayout,    // <router-outlet> kullandığı için burada olmalı
    Home,
    Category
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,   // <router-outlet>'i tanıtan modül,
    FormsModule
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptorsFromDi())
  ],
  bootstrap: [App]
})
export class AppModule { }
