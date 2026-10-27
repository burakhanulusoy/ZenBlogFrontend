<div align="center">

# 🌿 ZenBlog · Frontend

### Angular 20 + PrimeNG ile Çok Rollü Blog Platformu Arayüzü

![Angular 20](https://img.shields.io/badge/Angular-20-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![PrimeNG](https://img.shields.io/badge/UI-PrimeNG_20-DD0031?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Chart.js](https://img.shields.io/badge/Charts-Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)

<p align="center">
  <a href="https://github.com/KULLANICI_ADIN/ZenBlogBackend"><b>📘 Projenin tamamı, mimari ve ayrıntılı açıklama için → Backend deposu</b></a>
</p>

</div>

---

Bu depo, **ZenBlog** platformunun Angular arayüzüdür: bir ziyaretçi sitesi ve üç ayrı panel (Admin, Yazar, Okur). Backend .NET 9 Minimal API ile yazılmıştır. Mimari, güvenlik, iş akışları, diyagramlar ve bütün ekran görüntüleri **[backend deposundaki README](https://github.com/KULLANICI_ADIN/ZenBlogBackend)**'de yer alır.

## ✨ Öne Çıkanlar

- **Dört yerleşim:** Ziyaretçi sitesi, Admin paneli, piksel tasarımlı Yazar paneli ve Okur paneli.
- **Rol bazlı yönlendirme:** `AuthGuard` ve rotalardaki `data: { roles }`; yetkisiz erişimde 403 sayfası.
- **JWT:** Token interceptor ve `@auth0/angular-jwt` ile süre kontrolü, rol ve profil bilgisi okuma.
- **Güvenli formlar:** Cloudflare Turnstile bileşeni, Google ile giriş, giriş sonrası güvenli `returnUrl` yönlendirmesi.
- **Dashboard'lar:** Dönem seçici ve Chart.js grafikleriyle admin ve yazar genel bakışı; Elasticsearch tabanlı **Log kayıtları** ekranı.
- **Tasarım:** Ziyaretçi sitesi `.zb-site` kapsamında; yazar ve okur panellerinde `:host-context(.zb-pixel)` ile ortak sayfalar piksel temaya bürünür.
- **Performans:**
  - `shareReplay` ile önbelleğe alınan ortak site verisi.
  - `NgZone.runOutsideAngular` ile çalışan Swiper ve zamanlayıcılar.
  - `trackBy` ve debounce'lu arama.

## 📸 Ekran Görüntüleri


> Bütün ekran görüntüleri için: **[Backend README → Ekran Görüntüleri](https://github.com/KULLANICI_ADIN/ZenBlogBackend#-ekran-görüntüleri)**

## ⚙️ Kurulum

```bash
npm install
ng serve        # http://localhost:4200
```

Uygulama, backend'in `https://localhost:7200` adresinde çalıştığını varsayar. Backend kurulumu için backend deposundaki kurulum bölümüne bakın.

---

<div align="center">

<a href="https://www.linkedin.com/in/burakhanulusoy/">
  <img src="https://img.shields.io/badge/LinkedIn-Burakhan%20Ulusoy-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="Burakhan Ulusoy LinkedIn" />
</a>

</div>
