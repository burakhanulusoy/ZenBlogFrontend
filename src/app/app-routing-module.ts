import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainLayout } from './_layouts/main-layout/main-layout';
import { Home } from './_main-components/home/home';
import { AdminLayout } from './_layouts/admin-layout/admin-layout';
import { WriterLayout } from './_layouts/writer-layout/writer-layout';
import { Category } from './_admin-components/category/category';
import { Dashboard } from './_admin-components/dashboard/dashboard';
import { WriterDashboard } from './_writer-components/writer-dashboard/writer-dashboard';
import { MyBlogs } from './_personal-components/my-blogs/my-blogs';
import { Login } from './_main-components/login/login';
import { Register } from './_main-components/register/register';
import { VerifyEmail } from './_main-components/verify-email/verify-email';
import { ForgotPassword } from './_main-components/forgot-password/forgot-password';
import { AuthGuard } from './_guards/auth-guard';

const routes: Routes = [

  // GİRİŞ, KAYIT, DOĞRULAMA, ŞİFRE SIFIRLAMA: kendi başına tam ekran sayfalar
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'verify-email', component: VerifyEmail },
  { path: 'forgot-password', component: ForgotPassword },

  // ZİYARETÇİ SİTESİ: navbar + içerik
  {
    path: '', component: MainLayout,
    children: [
      { path: '', component: Home }
    ]
  },

  // ADMİN PANELİ: sadece Admin rolü
  {
    path: 'admin', component: AdminLayout,
    canActivate: [AuthGuard],
    data: { roles: ['Admin'] },
    children: [
      { path: '', component: Dashboard },
      { path: 'category', component: Category },

      // BANA ÖZEL (ortak sayfalar)
      { path: 'my-blogs', component: MyBlogs }
    ]
  },

  // YAZAR PANELİ: sadece Writer
  {
    path: 'writer', component: WriterLayout,
    canActivate: [AuthGuard],
    data: { roles: ['Writer'] },
    children: [
      { path: '', component: WriterDashboard },

      // YAZILARIM (admin'le aynı ortak sayfa)
      { path: 'my-blogs', component: MyBlogs }   // YENİ
    ]
  },

  // USER paneli ileride:
  // { path: 'account', ..., data: { roles: ['User'] } }

  // Var olmayan bir adrese girilirse ana sayfaya dön
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
