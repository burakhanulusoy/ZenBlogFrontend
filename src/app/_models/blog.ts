// DEĞİŞTİ: interface → class, alanlara tip eklendi.
// GET /api/blogs/{id} cevabındaki TEK blog (backend: GetBlogByIdQueryResult).
// Blog formu (yeni / düzenle) da bu modeli kullanıyor; formdaki her input bir alana bağlı.
// Alan adları API'nin döndüğü JSON ile birebir aynı (camelCase).
export class BlogDto {
  id: string;

  // Giriş
  mainTitle: string;
  mainDescription: string;
  coverImage: string;        // Azure'daki resmin adresi (URL)

  // 1. bölüm
  title1: string;
  description1: string;
  description2: string;
  blogImage1: string;

  // 2. bölüm
  title2: string;
  description3: string;
  blogImage2: string;

  // 3. bölüm
  title3: string;
  description4: string;

  // İlişkiler
  categoryId: string;
  category?: { id: string; name: string };
  appUserId?: string;        // yazar: backend token'dan dolduruyor, formdan GÖNDERMİYORUZ
  appUser?: any;

  createdAt?: string;
}
