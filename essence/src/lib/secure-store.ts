import * as SecureStore from 'expo-secure-store';

const ANTHROPIC_API_KEY = 'anthropic_api_key';

export async function getApiKey(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(ANTHROPIC_API_KEY);
  } catch (err) {
    console.error('secure-store: getApiKey failed', err);
    return null;
  }
}

export async function setApiKey(key: string): Promise<void> {
  const trimmed = key.trim();
  if (!trimmed) throw new Error('API key cannot be empty');
  await SecureStore.setItemAsync(ANTHROPIC_API_KEY, trimmed);
}

export async function clearApiKey(): Promise<void> {
  await SecureStore.deleteItemAsync(ANTHROPIC_API_KEY);
}

export async function hasApiKey(): Promise<boolean> {
  const key = await getApiKey();
  return !!key;
}