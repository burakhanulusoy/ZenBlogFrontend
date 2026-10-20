import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainLayout } from './_layouts/main-layout/main-layout';
import { Home } from './_main-components/home/home';
import { AdminLayout } from './_layouts/admin-layout/admin-layout';
import { Category } from './_admin-components/category/category';
import { Login } from './_main-components/login/login';
import { AuthGuard } from './_guards/auth-guard';
import { Register } from './_main-components/register/register';
import { VerifyEmail } from './_main-components/verify-email/verify-email';

const routes: Routes = [

  // GİRİŞ: kendi başına tam ekran sayfa (MainLayout'un navbar'ı görünmesin)
  { path: 'login', component: Login },

  { path: 'register', component: Register },
  { path: 'verify-email', component: VerifyEmail },

  // ZİYARETÇİ SİTESİ: navbar + içerik
  {
    path: '', component: MainLayout,
    children: [
      { path: '', component: Home }
    ]
  },

  // ADMİN PANELİ: giriş yapmamış biri giremez
  {
    path: 'admin', component: AdminLayout,
    canActivate: [AuthGuard],
    children: [
      // /admin'e girilince doğrudan kategori sayfasına git (boş sayfa görünmesin)
      { path: '', redirectTo: 'category', pathMatch: 'full' },
      { path: 'category', component: Category, canActivate: [AuthGuard] }
    ]
  },

  // Var olmayan bir adrese girilirse ana sayfaya dön
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
