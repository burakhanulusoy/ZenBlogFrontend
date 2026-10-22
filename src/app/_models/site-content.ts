// GET /api/social-medias → her hesap
export class SocialMediaDto {
  id: string;
  title: string;   // "Instagram"
  url: string;     // "https://instagram.com/zenblog"
  icon: string;    // Azure'daki ikon resminin adresi
}

// GET /api/abouts → her sürüm (backend en yeni en üstte sıralıyor)
export class AboutDto {
  id: string;
  mainTitle: string;
  description: string;
  title1: string;
  title2: string;
  title3: string;
  image1: string;
  image2: string;
  image3: string;
  createdAt: string;
}
