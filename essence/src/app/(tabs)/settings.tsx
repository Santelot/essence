import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fonts, Palette, Spacing } from '@/constants/theme';

export default function SettingsScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.kicker}>SETTINGS</Text>
        <Text style={styles.title}>Configuration</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.placeholder}>
          API key & Supabase configuration coming in Phase 2 / 3.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.deep },
  header: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Palette.line,
  },
  kicker: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    letterSpacing: 2.5,
    color: Palette.inkMid,
    marginBottom: Spacing.one,
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 36,
    color: Palette.mist,
    lineHeight: 42,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  placeholder: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Palette.inkMid,
    textAlign: 'center',
  },
});
