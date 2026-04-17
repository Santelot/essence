/**
 * Essence design system.
 * Dark-only editorial palette. Both Colors.light and Colors.dark map to the
 * same dark theme so existing ThemedText / ThemedView components keep working
 * without any changes.
 */

import '@/global.css';

import { Platform } from 'react-native';

// Raw brand colors. Use these for specific UI accents.
export const Palette = {
  void: '#0d1117',       // deepest background
  deep: '#161c26',       // screen background
  surface: '#1e2735',    // cards, modals
  line: '#2e3d52',       // borders, dividers
  mist: '#f2f4f7',       // primary text on dark
  inkMid: '#7a92aa',     // secondary text
  inkSoft: '#4a6080',    // placeholder, disabled
  blue: '#1a6dd6',       // primary accent
  blueLight: '#3d8ef0',  // hover, active
  cyan: '#0fa8aa',       // secondary accent
  amber: '#c47d14',      // warnings, highlights
  error: '#d63030',      // errors
} as const;

// Semantic tokens consumed by the themed components.
const darkTheme = {
  text: Palette.mist,
  textSecondary: Palette.inkMid,
  background: Palette.deep,
  backgroundElement: Palette.surface,
  backgroundSelected: Palette.line,
} as const;

export const Colors = {
  light: darkTheme,
  dark: darkTheme,
} as const;

export type ThemeColor = keyof typeof darkTheme;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
}) as { sans: string; serif: string; rounded: string; mono: string };

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 4,
  md: 8,
  lg: 12,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
