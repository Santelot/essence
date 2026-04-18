import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { AppState } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { Palette } from '@/constants/theme';
import { initDatabase } from '@/lib/db';
import { syncAll } from '@/lib/sync';

export default function RootLayout() {
  useEffect(() => {
    // Initialize the DB first, then kick off an opportunistic sync.
    // Both are fire-and-forget — failures get logged, never crash the app.
    (async () => {
      try {
        await initDatabase();
        syncAll().catch((err) =>
          console.warn('Essence: initial sync failed', err)
        );
      } catch (err) {
        console.error('Essence: DB init failed', err);
      }
    })();

    // Sync whenever the app returns to the foreground.
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        syncAll().catch((err) =>
          console.warn('Essence: foreground sync failed', err)
        );
      }
    });
    return () => sub.remove();
  }, []);

  return (
    <ThemeProvider value={DarkTheme}>
      <StatusBar style="light" />
      <AnimatedSplashOverlay />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Palette.deep },
        }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="reader/[id]"
          options={{ animation: 'slide_from_right' }}
        />
      </Stack>
    </ThemeProvider>
  );
}
