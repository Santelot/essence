export type MediaType =
  | 'book'
  | 'film'
  | 'album'
  | 'essay'
  | 'course'
  | 'topic';

export type TopicDepth = 'primer' | 'standard' | 'deep';

export interface Article {
  id: string;
  title: string;
  source: string;
  author: string | null;
  mediaType: MediaType;
  genre: string | null;
  html: string;
  createdAt: string;
  readAt: string | null;
  isSynced: boolean;
  isOffline: boolean;
  wordCount: number | null;
  readProgress: number;
}

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

export interface NewArticleInput {
  id?: string;
  title: string;
  source: string;
  author?: string | null;
  mediaType: MediaType;
  genre?: string | null;
  html: string;
  wordCount?: number | null;
}

export interface GenerateInput {
  mediaType: MediaType;
  title: string;
  author?: string;
  year?: string;
  genre?: string;
  toneNotes?: string;
  focusNotes?: string;
  depth?: TopicDepth; // Only used when mediaType === 'topic'
}

export interface CloudArticleData {
  id: string;
  title: string;
  source: string;
  author: string | null;
  mediaType: MediaType;
  genre: string | null;
  html: string;
  createdAt: string;
  readAt: string | null;
  wordCount: number | null;
  readProgress: number;
}
