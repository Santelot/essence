import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const URL_KEY = 'supabase_url';
const KEY_KEY = 'supabase_anon_key';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

let cachedClient: SupabaseClient | null = null;
let cachedUrl: string | null = null;

export async function getSupabaseConfig(): Promise<SupabaseConfig | null> {
  try {
    const url = await SecureStore.getItemAsync(URL_KEY);
    const anonKey = await SecureStore.getItemAsync(KEY_KEY);
    if (!url || !anonKey) return null;
    return { url, anonKey };
  } catch (err) {
    console.error('supabase: getConfig failed', err);
    return null;
  }
}

export async function setSupabaseConfig(config: SupabaseConfig): Promise<void> {
  const url = config.url.trim().replace(/\/+$/, '');
  const anonKey = config.anonKey.trim();
  if (!url || !anonKey) throw new Error('Both URL and anon key are required');
  await SecureStore.setItemAsync(URL_KEY, url);
  await SecureStore.setItemAsync(KEY_KEY, anonKey);
  // Invalidate cached client so the next call rebuilds with fresh credentials.
  cachedClient = null;
  cachedUrl = null;
}

export async function clearSupabaseConfig(): Promise<void> {
  await SecureStore.deleteItemAsync(URL_KEY);
  await SecureStore.deleteItemAsync(KEY_KEY);
  cachedClient = null;
  cachedUrl = null;
}

export async function hasSupabaseConfig(): Promise<boolean> {
  return !!(await getSupabaseConfig());
}

/** Returns null if unconfigured. Caller must handle that. */
export async function getSupabaseClient(): Promise<SupabaseClient | null> {
  const cfg = await getSupabaseConfig();
  if (!cfg) return null;
  if (cachedClient && cachedUrl === cfg.url) return cachedClient;
  cachedClient = createClient(cfg.url, cfg.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  cachedUrl = cfg.url;
  return cachedClient;
}
