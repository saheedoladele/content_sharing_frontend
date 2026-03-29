export interface Post {
    id: string;
    authorId: string;
    text: string;
    imageUrl?: string;
    likes: string[];
    createdAt: string;
  }