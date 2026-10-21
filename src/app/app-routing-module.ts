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
import { BlogForm } from './_personal-components/blog-form/blog-form';
import { Login } from './_main-components/login/login';
import { Register } from './_main-components/register/register';
import { VerifyEmail } from './_main-components/verify-email/verify-email';
import { ForgotPassword } from './_main-components/forgot-password/forgot-password';
import { AuthGuard } from './_guards/auth-guard';
import { AllBlogs } from './_admin-components/all-blogs/all-blogs';             // YENİ
import { BlogDetail } from './_personal-components/blog-detail/blog-detail';    // YENİ


// Neden 'new-blog' ayrı, düzenleme 'my-blogs/edit/:id' altında?
// Menüde "Bloglarım" bağlantısı /.../my-blogs ile BAŞLAYAN her adreste aktif görünüyor.
// Düzenleme sayfası onun altında olunca düzenlerken "Bloglarım" seçili kalıyor;
// yeni blog ayrı adreste olunca da sadece "Yeni Blog Yaz" seçili görünüyor.
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
    // DEĞİŞTİ: her sayfaya data.title eklendi → üst çubukta "Yönetim › Kategoriler" gibi görünüyor
        // DEĞİŞTİ: Tüm bloglar + detay + oradan düzenleme eklendi
    // returnTo: detay/form işi bitince hangi listeye dönülecek
    // backLabel: üstteki "geri" butonunda ne yazacak
    // Not: 'blogs/edit/:id' satırı 'blogs/:id' satırından ÖNCE olmalı (yoksa "edit" bir Id sanılabilir)
    children: [
      { path: '', component: Dashboard, data: { title: 'Genel bakış' } },

      // SİTE YÖNETİMİ
      { path: 'blogs', component: AllBlogs, data: { title: 'Tüm bloglar' } },
      { path: 'blogs/:id', component: BlogDetail, data: { title: 'Blog detayı', returnTo: 'blogs', backLabel: 'Tüm bloglar' } },
      { path: 'category', component: Category, data: { title: 'Kategoriler' } },

            // SIZE ÖZEL (ortak sayfalar)
      // Not: 'my-blogs/edit/:id' satırı 'my-blogs/:id' satırından ÖNCE olmalı
      { path: 'my-blogs', component: MyBlogs, data: { title: 'Bloglarım' } },
      { path: 'my-blogs/edit/:id', component: BlogForm, data: { title: 'Blogu düzenle' } },
      { path: 'my-blogs/:id', component: BlogDetail, data: { title: 'Blog detayı', canEdit: true, backLabel: 'Bloglarım' } },   // YENİ
      { path: 'new-blog', component: BlogForm, data: { title: 'Yeni blog yaz' } }
    ]
  },

  // YAZAR PANELİ: sadece Writer (şimdilik değişmedi)
  {
    path: 'writer', component: WriterLayout,
    canActivate: [AuthGuard],
    data: { roles: ['Writer'] },
       // DEĞİŞTİ: başlıklar + kendi bloğunun detayı (canEdit: true → Düzenle butonu görünür)
    children: [
      { path: '', component: WriterDashboard, data: { title: 'Genel bakış' } },

      // YAZILARIM (admin'le aynı ortak sayfalar)
      { path: 'my-blogs', component: MyBlogs, data: { title: 'Bloglarım' } },
      { path: 'my-blogs/edit/:id', component: BlogForm, data: { title: 'Blogu düzenle' } },
      { path: 'my-blogs/:id', component: BlogDetail, data: { title: 'Blog detayı', canEdit: true, backLabel: 'Bloglarım' } },
      { path: 'new-blog', component: BlogForm, data: { title: 'Yeni blog yaz' } }
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
