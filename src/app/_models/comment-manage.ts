// Panel yorum sayfaları (backend: CommentManageResult)
export class CommentManageDto {
  id: string;
  isReply: boolean;          // true: yanıt (alt yorum)
  body: string;
  createdAt: string;
  updatedAt?: string;
  authorId: string;
  authorName: string;
  authorImage?: string;
  blogId: string;
  blogTitle: string;
  blogAuthorId: string;
  replyToName?: string;      // yanıtsa: kime yanıt verildi
  replyCount: number;        // yorumsa: kaç yanıtı var
}

// Sayfa modu (rotadaki data.mode)
export type CommentsPageMode = 'mine' | 'onMyBlogs' | 'all';
