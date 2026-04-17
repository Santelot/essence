import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fonts, Palette, Spacing } from '@/constants/theme';

export default function GenerateScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.kicker}>GENERATE</Text>
        <Text style={styles.title}>New article</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.placeholder}>
          Article generation arrives in Phase 2.
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
