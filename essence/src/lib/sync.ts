import type { SupabaseClient } from '@supabase/supabase-js';

import type { MediaType } from '@/types';

import {
  createArticleFromCloud,
  getAllArticleIds,
  getUnsyncedArticles,
  markAsSynced,
} from './db';
import { isOnline } from './network';
import { getSupabaseClient } from './supabase';

interface CloudRow {
  id: string;
  title: string;
  source: string;
  author: string | null;
  media_type: MediaType;
  genre: string | null;
  html: string;
  created_at: string;
  read_at: string | null;
  word_count: number | null;
  read_progress: number;
}

export type SyncStatus =
  | { type: 'idle' }
  | { type: 'syncing' }
  | { type: 'success'; pushed: number; pulled: number; at: string }
  | { type: 'error'; message: string; at: string }
  | { type: 'skipped'; reason: 'offline' | 'unconfigured' };

let inFlight = false;

/**
 * Push unsynced local articles, then pull cloud articles we don't have.
 * Safe to call any time — guards against concurrent runs, missing config,
 * and offline state. Never throws; always returns a SyncStatus.
 */
export async function syncAll(): Promise<SyncStatus> {
  if (inFlight) return { type: 'syncing' };

  const client = await getSupabaseClient();
  if (!client) return { type: 'skipped', reason: 'unconfigured' };
  if (!(await isOnline())) return { type: 'skipped', reason: 'offline' };

  inFlight = true;
  try {
    const pushed = await pushUnsynced(client);
    const pulled = await pullMissing(client);
    return {
      type: 'success',
      pushed,
      pulled,
      at: new Date().toISOString(),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sync failed';
    console.error('sync: failed', err);
    return { type: 'error', message, at: new Date().toISOString() };
  } finally {
    inFlight = false;
  }
}

async function pushUnsynced(client: SupabaseClient): Promise<number> {
  const unsynced = await getUnsyncedArticles();
  if (unsynced.length === 0) return 0;

  let pushed = 0;
  for (const article of unsynced) {
    const { error } = await client.from('articles').upsert({
      id: article.id,
      title: article.title,
      source: article.source,
      author: article.author,
      media_type: article.mediaType,
      genre: article.genre,
      html: article.html,
      created_at: article.createdAt,
      read_at: article.readAt,
      word_count: article.wordCount,
      read_progress: article.readProgress,
    });
    if (error) {
      console.warn(`sync: push failed for ${article.id}`, error);
      continue; // keep going — don't let one bad row kill the whole sync
    }
    await markAsSynced(article.id);
    pushed++;
  }
  return pushed;
}

async function pullMissing(client: SupabaseClient): Promise<number> {
  const localIds = new Set(await getAllArticleIds());

  const { data, error } = await client
    .from('articles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  if (!data) return 0;

  let pulled = 0;
  for (const row of data as CloudRow[]) {
    if (localIds.has(row.id)) continue;
    await createArticleFromCloud({
      id: row.id,
      title: row.title,
      source: row.source,
      author: row.author,
      mediaType: row.media_type,
      genre: row.genre,
      html: row.html,
      createdAt: row.created_at,
      readAt: row.read_at,
      wordCount: row.word_count,
      readProgress: row.read_progress,
    });
    pulled++;
  }
  return pulled;
}
