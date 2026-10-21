// GET /api/blogs ve /api/blogs/my cevabındaki her blog (backend: GetBlogsQueryResult)
export class BlogListDto {
  id: string;
  mainTitle: string;
  coverImage: string;
  categoryId: string;
  category: { id: string; name: string };
  createdAt: string;
}
