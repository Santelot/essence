import * as Network from 'expo-network';

/**
 * One-shot connectivity check. Returns false on any error — we'd rather
 * be pessimistic than claim we're online when we aren't.
 */
export async function isOnline(): Promise<boolean> {
  try {
    const state = await Network.getNetworkStateAsync();
    return !!(state.isConnected && state.isInternetReachable !== false);
  } catch {
    return false;
  }
}

/** Reactive hook for UI — re-renders when connectivity changes. */
export function useOnlineStatus(): boolean {
  const state = Network.useNetworkState();
  return !!(state.isConnected && state.isInternetReachable !== false);
}
