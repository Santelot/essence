import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { Glass, Palette, Radius } from '@/constants/theme';

export type GlassVariant = 'cool' | 'warm';

interface GlassCardProps {
  children: React.ReactNode;
  variant?: GlassVariant;
  radius?: keyof typeof Radius;
  style?: ViewStyle | ViewStyle[];
  strong?: boolean;
}

/**
 * Fake-glass surface. Three stacked layers create the illusion of depth:
 *   1. Base fill — the "glass body," slightly lighter than the background
 *   2. Top sheen overlay — a very faint lighter strip at the top, simulating
 *      reflected light catching the edge
 *   3. Hairline border — defines the edge precisely
 *
 * Plus a subtle shadow to lift the card off the background. On iOS this is
 * a real shadow; on Android it's approximated via `elevation`.
 */
export function GlassCard({
  children,
  variant = 'cool',
  radius = 'md',
  style,
  strong = false,
}: GlassCardProps) {
  const baseFill = strong
    ? variant === 'warm'
      ? Glass.fillWarmStrong
      : Glass.fillCoolStrong
    : variant === 'warm'
    ? Glass.fillWarm
    : Glass.fillCool;

  const sheen = variant === 'warm' ? Glass.sheenWarm : Glass.sheenCool;
  const borderColor =
    variant === 'warm' ? Glass.borderWarm : Glass.borderCool;

  return (
    <View
      style={[
        styles.wrapper,
        {
          borderRadius: Radius[radius],
          borderColor,
          backgroundColor: baseFill,
          shadowColor: variant === 'warm' ? Palette.ember : '#000',
        },
        style,
      ]}>
      {/* Top-edge sheen: a subtle lighter band in the upper third of the card */}
      <View
        pointerEvents="none"
        style={[
          styles.sheen,
          {
            backgroundColor: sheen,
            borderTopLeftRadius: Radius[radius],
            borderTopRightRadius: Radius[radius],
          },
        ]}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    // Soft shadow lifts cards off the background.
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 3,
  },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    opacity: 0.9,
  },
});