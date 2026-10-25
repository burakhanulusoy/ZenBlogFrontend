import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './_guards/auth-guard';

// Layout'lar
import { MainLayout } from './_layouts/main-layout/main-layout';
import { AdminLayout } from './_layouts/admin-layout/admin-layout';
import { WriterLayout } from './_layouts/writer-layout/writer-layout';
import { UserLayout } from './_layouts/user-layout/user-layout';                 // YENİ

// Ziyaretçi sitesi ve kimlik doğrulama
import { Home } from './_main-components/home/home';
import { Login } from './_main-components/login/login';
import { Register } from './_main-components/register/register';
import { VerifyEmail } from './_main-components/verify-email/verify-email';
import { ForgotPassword } from './_main-components/forgot-password/forgot-password';

// Admin sayfaları
import { Dashboard } from './_admin-components/dashboard/dashboard';
import { AllBlogs } from './_admin-components/all-blogs/all-blogs';
import { Category } from './_admin-components/category/category';
import { Users } from './_admin-components/users/users';
import { UserDetail } from './_admin-components/user-detail/user-detail';

// Yazar sayfaları
import { WriterDashboard } from './_writer-components/writer-dashboard/writer-dashboard';

// Ortak sayfalar (birden fazla panelde kullanılıyor)
import { MyBlogs } from './_personal-components/my-blogs/my-blogs';
import { BlogForm } from './_personal-components/blog-form/blog-form';
import { BlogDetail } from './_personal-components/blog-detail/blog-detail';
import { Profile } from './_personal-components/profile/profile';
import { ErrorPage } from './_main-components/error-page/error-page';
import { Roles } from './_admin-components/roles/roles';
import { WriterApplications } from './_admin-components/writer-applications/writer-applications';
import { WriterApplicationDetail } from './_admin-components/writer-application-detail/writer-application-detail';
import { BecomeWriter } from './_user-components/become-writer/become-writer';
import { Abouts } from './_admin-components/abouts/abouts';
import { AboutForm } from './_admin-components/about-form/about-form';
import { SocialMedias } from './_admin-components/social-medias/social-medias';
import { Teams } from './_admin-components/teams/teams';
import { TeamForm } from './_admin-components/team-form/team-form';
import { ContactInfo } from './_admin-components/contact-info/contact-info';
import { ContactMessages } from './_admin-components/contact-messages/contact-messages';
import { SiteBlogDetail } from './_main-components/site-blog-detail/site-blog-detail';   // YENİ
import { SiteCategory } from './_main-components/site-category/site-category';
import { SiteAbout } from './_main-components/site-about/site-about';
import { SiteContact } from './_main-components/site-contact/site-contact';
import { CommentsPage } from './_personal-components/comments-page/comments-page';

// ---------------------------------------------------------------------
// ROTA NOTLARI
// data.title    → üst çubuktaki sayfa adı ("Yönetim › Kategoriler")
// data.returnTo → detay/form işi bitince hangi listeye dönülecek (varsayılan: my-blogs)
// data.backLabel→ üstteki "geri" butonunda ne yazacak
// data.canEdit  → blog detayında "Düzenle" butonu görünsün mü (sadece kendi bloğunda)
//
// Sıra önemli: 'my-blogs/edit/:id' satırı 'my-blogs/:id' satırından ÖNCE olmalı,
// yoksa "edit" kelimesi bir Id sanılabilir.
//
// Neden 'new-blog' ayrı, düzenleme 'my-blogs/edit/:id' altında?
// Menüde "Bloglarım" /.../my-blogs ile BAŞLAYAN her adreste seçili görünüyor.
// Düzenleme onun altında olunca düzenlerken "Bloglarım" seçili kalıyor.
// ---------------------------------------------------------------------
const routes: Routes = [

  // GİRİŞ, KAYIT, DOĞRULAMA, ŞİFRE SIFIRLAMA: kendi başına tam ekran sayfalar
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'verify-email', component: VerifyEmail },
  { path: 'forgot-password', component: ForgotPassword },
    // YENİ: 403 → AuthGuard rolü yetmeyen kişiyi buraya gönderiyor
  { path: 'forbidden', component: ErrorPage, data: { code: 403 } },

  // ZİYARETÇİ SİTESİ: navbar + içerik
  {
    path: '', component: MainLayout,
                 children: [
      { path: '', component: Home },
      { path: 'about', component: SiteAbout },
      { path: 'contact', component: SiteContact },          // YENİ
      { path: 'blog/:id', component: SiteBlogDetail },
      { path: 'category/:id', component: SiteCategory }
    ]
  },

  // =================================================================
  // ADMİN PANELİ: sadece Admin
  // =================================================================
  {
    path: 'admin', component: AdminLayout,
    canActivate: [AuthGuard],
    data: { roles: ['Admin'] },
    children: [
      { path: '', component: Dashboard, data: { title: 'Genel bakış' } },

      // SİTE YÖNETİMİ
      // Tüm bloglar'da düzenleme yok (admin başkasının yazısını düzenlemez) → canEdit yok
      { path: 'blogs', component: AllBlogs, data: { title: 'Tüm bloglar' } },
      { path: 'blogs/:id', component: BlogDetail, data: { title: 'Blog detayı', returnTo: 'blogs', backLabel: 'Tüm bloglar' } },
      { path: 'category', component: Category, data: { title: 'Kategoriler' } },
      { path: 'users', component: Users, data: { title: 'Kullanıcılar' } },
      { path: 'users/:id', component: UserDetail, data: { title: 'Kullanıcı detayı' } },
            { path: 'roles', component: Roles, data: { title: 'Roller' } },   // YENİ
            { path: 'comments', component: CommentsPage, data: { title: 'Tüm yorumlar', mode: 'all' } },               // YENİ
      { path: 'writer-applications', component: WriterApplications, data: { title: 'Yazarlık başvuruları' } },        // YENİ
      { path: 'writer-applications/:id', component: WriterApplicationDetail, data: { title: 'Başvuru detayı' } },
            // SİTE İÇERİĞİ (YENİ)
      { path: 'abouts', component: Abouts, data: { title: 'Hakkımızda' } },
      { path: 'abouts/new', component: AboutForm, data: { title: 'Yeni Hakkımızda içeriği' } },
      { path: 'abouts/edit/:id', component: AboutForm, data: { title: 'Hakkımızda düzenle' } },
      { path: 'social-medias', component: SocialMedias, data: { title: 'Sosyal medya' } },    // YENİ
            { path: 'teams', component: Teams, data: { title: 'Ekip' } },                          // YENİ
      { path: 'teams/new', component: TeamForm, data: { title: 'Yeni ekip üyesi' } },        // YENİ
      { path: 'teams/edit/:id', component: TeamForm, data: { title: 'Ekip üyesini düzenle' } }, // YENİ
            { path: 'contact-info', component: ContactInfo, data: { title: 'İletişim bilgileri' } },     // YENİ
      { path: 'contact-messages', component: ContactMessages, data: { title: 'Gelen mesajlar' } }, // YENİ
      // SIZE ÖZEL (ortak sayfalar)
      { path: 'my-blogs', component: MyBlogs, data: { title: 'Bloglarım' } },
      { path: 'my-blogs/edit/:id', component: BlogForm, data: { title: 'Blogu düzenle' } },
      { path: 'my-blogs/:id', component: BlogDetail, data: { title: 'Blog detayı', canEdit: true, backLabel: 'Bloglarım' } },
      { path: 'new-blog', component: BlogForm, data: { title: 'Yeni blog yaz' } },
            { path: 'my-comments', component: CommentsPage, data: { title: 'Yorumlarım', mode: 'mine' } },             // YENİ
      { path: 'blog-comments', component: CommentsPage, data: { title: 'Gelen yorumlar', mode: 'onMyBlogs' } },  // YENİ
      { path: 'profile', component: Profile, data: { title: 'Profilim' } },
    ]
  },

  // =================================================================
  // YAZAR PANELİ: sadece Writer
  // =================================================================
  {
    path: 'writer', component: WriterLayout,
    canActivate: [AuthGuard],
    data: { roles: ['Writer'] },
    children: [
      { path: '', component: WriterDashboard, data: { title: 'Genel bakış' } },

      // YAZILARIM (admin'le aynı ortak sayfalar)
      { path: 'my-blogs', component: MyBlogs, data: { title: 'Bloglarım' } },
      { path: 'my-blogs/edit/:id', component: BlogForm, data: { title: 'Blogu düzenle' } },
      { path: 'my-blogs/:id', component: BlogDetail, data: { title: 'Blog detayı', canEdit: true, backLabel: 'Bloglarım' } },
      { path: 'new-blog', component: BlogForm, data: { title: 'Yeni blog yaz' } },

      // HESABIM
            { path: 'blog-comments', component: CommentsPage, data: { title: 'Gelen yorumlar', mode: 'onMyBlogs' } },  // YENİ
      { path: 'my-comments', component: CommentsPage, data: { title: 'Yorumlarım', mode: 'mine' } },             // YENİ
      { path: 'profile', component: Profile, data: { title: 'Profilim' } }
    ]
  },

  // =================================================================
  // YENİ: OKUR (USER) PANELİ: sadece User
  // AuthGuard: User rolündeki kişi giriş yapınca getHomeRoute() → /account
  // =================================================================
  {
    path: 'account', component: UserLayout,
    canActivate: [AuthGuard],
    data: { roles: ['User'] },
    children: [
      // /account → doğrudan Profilim (şimdilik tek sayfa)
      // pathMatch 'full': sadece adres TAM OLARAK /account ise yönlendir
      { path: '', redirectTo: 'profile', pathMatch: 'full' },
      { path: 'profile', component: Profile, data: { title: 'Profilim' } },
            { path: 'my-comments', component: CommentsPage, data: { title: 'Yorumlarım', mode: 'mine' } },             // YENİ
      { path: 'become-writer', component: BecomeWriter, data: { title: 'Yazar ol' } }   // YENİ
    ]
  },

  // Var olmayan bir adrese girilirse ana sayfaya dön
    // DEĞİŞTİ: Olmayan bir adres → 404 sayfası (eskiden sessizce ana sayfaya atıyordu)
  { path: '**', component: ErrorPage, data: { code: 404 } }
];

@NgModule({
    // DEĞİŞTİ: sayfa değişince en üstten başla (bir blogdan diğerine geçince kaldığı yerden açılmasın)
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'top' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
