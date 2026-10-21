// GET /api/blogs ve /api/blogs/my cevabındaki her blog (backend: GetBlogsQueryResult)
export class BlogListDto {
  id: string;
  mainTitle: string;
  coverImage: string;
  mainDescription: string;                 // YENİ: listede başlığın altındaki kısa açıklama
  categoryId: string;
  category: { id: string; name: string };
  appUserId: string;                       // YENİ
  // YENİ: yazar (backend: GetUsersQueryResult)
  appUser: { id: string; name: string; surname: string; imageUrl?: string };
  createdAt: string;
}
