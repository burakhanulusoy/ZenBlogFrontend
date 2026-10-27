<div align="center">

# 🌿 ZenBlog · Frontend

### Angular 20 + PrimeNG ile Çok Rollü Blog Platformu Arayüzü

![Angular 20](https://img.shields.io/badge/Angular-20-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![PrimeNG](https://img.shields.io/badge/UI-PrimeNG_20-DD0031?style=for-the-badge)
![RxJS](https://img.shields.io/badge/RxJS-B7178C?style=for-the-badge&logo=reactivex&logoColor=white)
![Chart.js](https://img.shields.io/badge/Charts-Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)

<p align="center">
  <a href="https://github.com/KULLANICI_ADIN/ZenBlogBackend">
    <b>📘 Projenin tamamı, mimari, özellikler ve bütün ekran görüntüleri için → Backend deposu</b>
  </a>
</p>

</div>

---

Bu depo, **ZenBlog** platformunun Angular arayüzüdür. Backend **.NET 9 Minimal API** ile yazılmıştır; özelliklerin, güvenlik kurgusunun ve ekran görüntülerinin tamamı **[backend deposundaki README](https://github.com/KULLANICI_ADIN/ZenBlogBackend)**'de yer alır.

## ✨ Öne Çıkanlar

- **Dört yerleşim:** Ziyaretçi sitesi, Admin paneli, piksel (8-bit) tasarımlı Yazar paneli ve Okur paneli.
- **Rol bazlı yönlendirme:** `AuthGuard` ve rotalardaki `data: { roles }`; yetkisiz erişimde 403 sayfası.
- **JWT:** Token interceptor; `@auth0/angular-jwt` ile süre kontrolü, rol ve profil bilgisi okuma.
- **Güvenli formlar:** Cloudflare Turnstile bileşeni, Google ile giriş, giriş sonrası yalnızca site içi `returnUrl` yönlendirmesi.
- **Dashboard'lar ve log ekranı:** Dönem seçici ve Chart.js (`p-chart`) grafikleri; Elasticsearch tabanlı "Log kayıtları" sayfası.
- **Kapsamlı stiller:** Ziyaretçi sitesi `.zb-site` kapsamında; yazar ve okur panellerinde `:host-context(.zb-pixel)` ile ortak sayfalar piksel temaya bürünür.
- **Performans:**
  - Ortak site verisi `shareReplay(1)` ile önbelleğe alınır.
  - Swiper ve zamanlayıcılar `NgZone.runOutsideAngular` ile çalıştırılır.
  - Listelerde `trackBy`, aramalarda `debounceTime` kullanılır.

## 🧱 Kullanılan Teknolojiler

| Teknoloji | Kullanımı |
| :--- | :--- |
| **Angular 20** | NgModule yapısı, Router, Reactive/Template formlar, HttpClient |
| **PrimeNG 20** + `@primeuix/themes` | Tablo, diyalog, drawer, select, paginator, chart ve form bileşenleri |
| **@auth0/angular-jwt** | Token çözümleme ve süre kontrolü |
| **Chart.js** | Dashboard ve log grafikleri |
| **Swiper** | Ana sayfa slider'ı |
| **SweetAlert2** | Onay pencereleri ve bildirimler |
| **Cloudflare Turnstile · Google Identity** | Bot koruması ve Google ile giriş |

## 🗺️ Rotalar ve Paneller

| Adres | Yerleşim | Erişim |
| :--- | :--- | :--- |
| `/` | Ziyaretçi sitesi: ana sayfa, `blog/:id`, `category/:id`, `about`, `contact` | Herkese açık |
| `/login` · `/register` · `/verify-email` · `/forgot-password` | Tam ekran kimlik sayfaları | Herkese açık |
| `/admin` | Admin paneli | Admin |
| `/writer` | Yazar paneli (piksel tasarım) | Writer |
| `/account` | Okur paneli | User |
| `/forbidden` · `**` | 403 ve 404 sayfaları | — |

## 📂 Proje Yapısı

<details>
<summary><b>Klasör yapısını görmek için tıklayın</b></summary>

```text
src/
├── app/
│   ├── _layouts/                 # main-layout (site), admin-layout, writer-layout, user-layout
│   │
│   ├── _main-components/         # Ziyaretçi sitesi ve kimlik sayfaları
│   │   ├── home/                 #   Ana sayfa (slider, son yazılar, trending, kategori bölümleri)
│   │   ├── site-blog-detail/     #   Blog detayı, yorumlar ve yanıtlar, ilgili yazılar
│   │   ├── site-category/        #   Kategori sayfası (sayfalama)
│   │   ├── site-about/           #   Hakkımızda ve Ekip
│   │   ├── site-contact/         #   İletişim (harita, Turnstile korumalı form)
│   │   ├── login/ · register/    #   Giriş ve kayıt (Google, Turnstile)
│   │   ├── verify-email/         #   6 haneli e-posta doğrulama
│   │   ├── forgot-password/      #   Şifre sıfırlama
│   │   └── error-page/           #   403 / 404
│   │
│   ├── _admin-components/        # Admin paneli
│   │   ├── dashboard/            #   Genel bakış
│   │   ├── all-blogs/ · category/
│   │   ├── users/ · user-detail/ #   Kullanıcılar, bloke, rol atama
│   │   ├── roles/
│   │   ├── writer-applications/ · writer-application-detail/
│   │   ├── system-logs/          #   Log kayıtları (Elasticsearch)
│   │   ├── abouts/ · about-form/ · teams/ · team-form/
│   │   └── social-medias/ · contact-info/ · contact-messages/
│   │
│   ├── _writer-components/       # writer-dashboard (piksel tasarım)
│   ├── _user-components/         # become-writer (yazarlık başvurusu)
│   │
│   ├── _personal-components/     # Paneller arasında ORTAK sayfalar
│   │   ├── my-blogs/ · blog-form/ · blog-detail/
│   │   ├── comments-page/        #   Yorumlarım / Gelen yorumlar / Tüm yorumlar (tek component, 3 mod)
│   │   └── profile/              #   Profil ve hesap kapatma
│   │
│   ├── _shared-components/       # turnstile, auth-shell
│   ├── _guards/                  # auth-guard (rol bazlı)
│   ├── _interceptors/            # token-interceptor
│   ├── _services/                # API servisleri (auth, blog, site, dashboard, log...)
│   ├── _models/                  # DTO ve tipler
│   └── _constans/                # Google ve Turnstile ayarları
│
├── styles.css                    # Panel teması, .zb-site (ziyaretçi sitesi) ve .zb-pixel (piksel tema)
└── index.html
```

</details>

## ⚙️ Kurulum

```bash
npm install
ng serve        # http://localhost:4200
```

Uygulama, backend'in `https://localhost:7200` adresinde çalıştığını varsayar. Backend kurulumu için **[backend deposundaki kurulum bölümüne](https://github.com/KULLANICI_ADIN/ZenBlogBackend#️-kurulum)** bakın.

---

<div align="center">

<a href="https://www.linkedin.com/in/burakhanulusoy/">
  <img src="https://img.shields.io/badge/LinkedIn-Burakhan%20Ulusoy-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="Burakhan Ulusoy LinkedIn" />
</a>

<br>
<br>

**🌿 ZenBlog · Angular 20 + PrimeNG**

</div>
