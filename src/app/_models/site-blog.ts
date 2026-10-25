// =====================================================================
// ZİYARETÇİ SİTESİ: BLOG DETAYI MODELLERİ
// (Paneldeki blog modelleriyle karışmasın diye "Site" ön eki)
// =====================================================================

import { HomeBlogDto } from "./home";

// GET /api/blogs/{id} → okunan blog
export class SiteBlogDto {
  id: string;
  mainTitle: string;
  mainDescription: string;
  coverImage: string;
  title1: string;
  description1: string;
  description2: string;
  blogImage1: string;
  title2: string;
  description3: string;
  blogImage2: string;
  title3: string;
  description4: string;
  categoryId: string;
  category: { id: string; name: string };
  appUserId: string;
  appUser: { id: string; name: string; surname: string; imageUrl?: string };
  createdAt: string;
}

// Yanıt (alt yorum)
export class BlogReplyDto {
  id: string;
  body: string;
  createdAt: string;
  updatedAt?: string;
  authorId: string;
  authorName: string;
  authorImage?: string;
}

// Yorum + altındaki yanıtlar (GET /api/comments/byBlogId/{blogId})
export class BlogCommentDto extends BlogReplyDto {
  replies: BlogReplyDto[];
}


// Kategori sayfası (GET /api/categories/{id}/blogs)
// Kartlar ana sayfadakiyle aynı biçimde (HomeBlogDto)
export class CategoryPageDto {
  categoryId: string;
  categoryName: string;
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  blogs: HomeBlogDto[];
}
