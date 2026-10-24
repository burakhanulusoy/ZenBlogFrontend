// GET /api/home → ana sayfanın tamamı (backend: HomePageResult)
export class HomeBlogDto {
  id: string;
  mainTitle: string;
  mainDescription: string;
  coverImage: string;
  createdAt: string;
  categoryId: string;
  categoryName: string;
  authorId: string;
  authorName: string;
  authorImage?: string;
  commentCount: number;
}

export class HomeCategorySectionDto {
  categoryId: string;
  categoryName: string;
  blogs: HomeBlogDto[];
}

export class HomePageDto {
  slider: HomeBlogDto[];
  latest: HomeBlogDto[];
  trending: HomeBlogDto[];
  categorySections: HomeCategorySectionDto[];
}
