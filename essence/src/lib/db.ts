import * as SQLite from 'expo-sqlite';

import type {
  Article,
  ArticleRow,
  CloudArticleData,
  NewArticleInput,
} from '@/types';

import { seedArticles } from './seed-articles';

const DB_NAME = 'essence.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/** RFC 4122 v4 UUID. Not cryptographic — fine for local article IDs. */
function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function openAndMigrate(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS articles (
      id            TEXT PRIMARY KEY NOT NULL,
      title         TEXT NOT NULL,
      source        TEXT NOT NULL,
      author        TEXT,
      media_type    TEXT NOT NULL,
      genre         TEXT,
      html          TEXT NOT NULL,
      created_at    TEXT NOT NULL,
      read_at       TEXT,
      is_synced     INTEGER NOT NULL DEFAULT 0,
      is_offline    INTEGER NOT NULL DEFAULT 1,
      word_count    INTEGER,
      read_progress REAL NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_articles_created_at
      ON articles(created_at DESC);
  `);
  return db;
}

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  if (!initPromise) initPromise = openAndMigrate();
  dbInstance = await initPromise;
  return dbInstance;
}

function rowToArticle(row: ArticleRow): Article {
  return {
    id: row.id,
    title: row.title,
    source: row.source,
    author: row.author,
    mediaType: row.media_type,
    genre: row.genre,
    html: row.html,
    createdAt: row.created_at,
    readAt: row.read_at,
    isSynced: row.is_synced === 1,
    isOffline: row.is_offline === 1,
    wordCount: row.word_count,
    readProgress: row.read_progress,
  };
}

export async function initDatabase(): Promise<void> {
  const db = await getDb();
  const countRow = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM articles'
  );
  const count = countRow?.count ?? 0;
  if (count === 0) {
    for (const seed of seedArticles) {
      await createArticle(seed);
    }
    // Mark seeds as already-synced so they don't upload to your personal
    // Supabase instance on first sync. They're client-side demo data.
    await db.runAsync('UPDATE articles SET is_synced = 1 WHERE is_synced = 0');
  }
}

export async function getAllArticles(): Promise<Article[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<ArticleRow>(
    'SELECT * FROM articles ORDER BY created_at DESC'
  );
  return rows.map(rowToArticle);
}

export async function getArticleById(id: string): Promise<Article | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<ArticleRow>(
    'SELECT * FROM articles WHERE id = ?',
    [id]
  );
  return row ? rowToArticle(row) : null;
}

export async function createArticle(input: NewArticleInput): Promise<Article> {
  const db = await getDb();
  const id = input.id ?? uuid();
  const createdAt = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO articles
      (id, title, source, author, media_type, genre, html,
       created_at, read_at, is_synced, is_offline, word_count, read_progress)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, 0, 1, ?, 0)`,
    [
      id,
      input.title,
      input.source,
      input.author ?? null,
      input.mediaType,
      input.genre ?? null,
      input.html,
      createdAt,
      input.wordCount ?? null,
    ]
  );
  const created = await getArticleById(id);
  if (!created) throw new Error(`Failed to create article ${id}`);
  return created;
}

export async function updateReadProgress(
  id: string,
  progress: number
): Promise<void> {
  const db = await getDb();
  const clamped = Math.max(0, Math.min(1, progress));
  await db.runAsync(
    'UPDATE articles SET read_progress = ? WHERE id = ? AND read_progress < ?',
    [clamped, id, clamped]
  );
}

export async function markAsRead(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE articles SET read_at = COALESCE(read_at, ?) WHERE id = ?',
    [new Date().toISOString(), id]
  );
}

export async function deleteArticle(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM articles WHERE id = ?', [id]);
}

export async function markAsSynced(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE articles SET is_synced = 1 WHERE id = ?', [id]);
}

export async function getUnsyncedArticles(): Promise<Article[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<ArticleRow>(
    'SELECT * FROM articles WHERE is_synced = 0 ORDER BY created_at ASC'
  );
  return rows.map(rowToArticle);
}

/** For sync: returns just the IDs so we can quickly diff local vs cloud. */
export async function getAllArticleIds(): Promise<string[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ id: string }>('SELECT id FROM articles');
  return rows.map((r) => r.id);
}

/**
 * Insert an article pulled from Supabase, preserving the cloud's id,
 * created_at, read state, etc. INSERT OR IGNORE is a defensive guard
 * against race conditions where another sync path already inserted it.
 */
export async function createArticleFromCloud(
  data: CloudArticleData
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR IGNORE INTO articles
      (id, title, source, author, media_type, genre, html,
       created_at, read_at, is_synced, is_offline, word_count, read_progress)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?)`,
    [
      data.id,
      data.title,
      data.source,
      data.author,
      data.mediaType,
      data.genre,
      data.html,
      data.createdAt,
      data.readAt,
      data.wordCount,
      data.readProgress,
    ]
  );
}
