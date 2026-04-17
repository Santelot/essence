export type MediaType = 'book' | 'film' | 'album' | 'essay' | 'course';

export interface Article {
  id: string;
  title: string;
  source: string;
  author: string | null;
  mediaType: MediaType;
  genre: string | null;
  html: string;
  createdAt: string;       // ISO timestamp
  readAt: string | null;   // null = unread
  isSynced: boolean;
  isOffline: boolean;
  wordCount: number | null;
  readProgress: number;    // 0.0 – 1.0
}

/** Raw SQLite row shape — pre-conversion. */
export interface ArticleRow {
  id: string;
  title: string;
  source: string;
  author: string | null;
  media_type: MediaType;
  genre: string | null;
  html: string;
  created_at: string;
  read_at: string | null;
  is_synced: 0 | 1;
  is_offline: 0 | 1;
  word_count: number | null;
  read_progress: number;
}

/** Input shape for creating a new article. */
export interface NewArticleInput {
  id?: string;              // optional; db.ts generates one if missing
  title: string;
  source: string;
  author?: string | null;
  mediaType: MediaType;
  genre?: string | null;
  html: string;
  wordCount?: number | null;
}
