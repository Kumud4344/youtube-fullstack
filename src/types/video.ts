export type PublicVideo = {
  id: string;
  title: string;
  description: string;
  slug: string;
  ownerId: string;
  channel: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
  };
  videoUrl: string;
  thumbnailUrl?: string;
  duration: number;
  views: number;
  likesCount: number;
  dislikesCount: number;
  commentsCount: number;
  downloadsCount: number;
  visibility: string;
  tags: string[];
  category: string;
  fileSize: number;
  mimeType: string;
  processingStatus: string;
  createdAt: string;
  updatedAt: string;
};
