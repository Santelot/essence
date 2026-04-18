/**
 * Essence design system — "Midnight & Ember".
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Palette = {
  ink: '#07080c',
  night: '#11131a',
  slate: '#1a1d28',

  void: '#07080c',
  deep: '#11131a',
  surface: '#1a1d28',
  line: 'rgba(255, 255, 255, 0.09)',

  mist: '#f5f5f7',
  inkMid: '#8e8e93',
  inkSoft: '#48484a',

  glow: '#4a9eff',
  glowSoft: '#7db8ff',

  ember: '#ff8744',
  emberSoft: '#ffa574',

  blue: '#4a9eff',
  blueLight: '#7db8ff',
  cyan: '#4a9eff',

  error: '#ff453a',
  amber: '#ffd166',
} as const;

export const Glass = {
  fillCool: 'rgba(24, 28, 38, 0.72)',
  fillWarm: 'rgba(36, 28, 22, 0.72)',
  fillCoolStrong: 'rgba(40, 46, 60, 0.85)',
  fillWarmStrong: 'rgba(58, 38, 26, 0.85)',

  sheenCool: 'rgba(255, 255, 255, 0.04)',
  sheenWarm: 'rgba(255, 180, 120, 0.05)',

  borderCool: 'rgba(255, 255, 255, 0.1)',
  borderWarm: 'rgba(255, 180, 120, 0.22)',
} as const;

const darkTheme = {
  text: Palette.mist,
  textSecondary: Palette.inkMid,
  background: Palette.night,
  backgroundElement: Palette.slate,
  backgroundSelected: 'rgba(255, 255, 255, 0.1)',
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
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
} as const;

export const BottomTabInset = Platform.select({ ios: 92, android: 84 }) ?? 88;
export const MaxContentWidth = 800;

/**
 * Per-media-type accent colors. Each has a `vivid` (for unread / active)
 * and `dim` (for read / inactive) variant so read articles fade visually.
 */
export const TypeAccents = {
  book: { vivid: '#ff8744', dim: 'rgba(255, 135, 68, 0.45)' },
  film: { vivid: '#c779ff', dim: 'rgba(199, 121, 255, 0.45)' },
  album: { vivid: '#4ad9a8', dim: 'rgba(74, 217, 168, 0.45)' },
  essay: { vivid: '#4a9eff', dim: 'rgba(74, 158, 255, 0.45)' },
  course: { vivid: '#ffd166', dim: 'rgba(255, 209, 102, 0.45)' },
  topic: { vivid: '#ff5e8a', dim: 'rgba(255, 94, 138, 0.45)' },
} as const;

export type TypeAccent = keyof typeof TypeAccents;
