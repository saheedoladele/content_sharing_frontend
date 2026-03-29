export interface Comment {
  id: string;
  postId: string;
  parentCommentId: string | null;
  authorId: string;
  text: string;
  createdAt: string;
}
