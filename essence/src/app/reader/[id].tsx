import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { Fonts, Glass, Palette, Spacing } from '@/constants/theme';
import { getArticleById, markAsRead } from '@/lib/db';
import type { Article } from '@/types';

export default function ReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [article, setArticle] = useState<Article | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) {
      setNotFound(true);
      return;
    }
    (async () => {
      try {
        const found = await getArticleById(id);
        if (!found) {
          setNotFound(true);
          return;
        }
        setArticle(found);
        markAsRead(id).catch((err) =>
          console.warn('Reader: markAsRead failed', err)
        );
      } catch (err) {
        console.error('Reader: load failed', err);
        setNotFound(true);
      }
    })();
  }, [id]);

  if (notFound) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ReaderHeader title="Not found" onBack={() => router.back()} />
        <View style={styles.center}>
          <Text style={styles.errorText}>This article no longer exists.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!article) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ReaderHeader title="Loading…" onBack={() => router.back()} />
        <View style={styles.center}>
          <ActivityIndicator color={Palette.glow} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ReaderHeader
        title={article.title}
        mediaType={article.mediaType}
        onBack={() => router.back()}
      />
      <WebView
        originWhitelist={['*']}
        source={{ html: article.html }}
        style={styles.webview}
        containerStyle={styles.webviewContainer}
        // ts-expect-error — `backgroundColor` is a valid WebView prop at runtime.
        backgroundColor={Palette.ink}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

function ReaderHeader({
  title,
  mediaType,
  onBack,
}: {
  title: string;
  mediaType?: string;
  onBack: () => void;
}) {
  return (
    <View style={styles.headerWrap}>
      <View style={styles.headerInner}>
        <Pressable
          onPress={onBack}
          hitSlop={12}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <View style={styles.headerTextWrap}>
          {mediaType && (
            <Text style={styles.headerKicker}>{mediaType.toUpperCase()}</Text>
          )}
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Palette.ink,
  },
  headerWrap: {
    backgroundColor: Palette.night,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Glass.borderCool,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: Spacing.three,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  backArrow: {
    color: Palette.mist,
    fontSize: 24,
    fontWeight: '300',
  },
  pressed: {
    opacity: 0.5,
    transform: [{ scale: 0.96 }],
  },
  headerTextWrap: {
    flex: 1,
  },
  headerKicker: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
    color: Palette.glow,
    fontWeight: '700',
  },
  headerTitle: {
    fontFamily: Fonts.serif,
    fontSize: 17,
    color: Palette.mist,
    marginTop: 2,
    fontWeight: '500',
  },
  webview: {
    flex: 1,
    backgroundColor: Palette.ink,
  },
  webviewContainer: {
    backgroundColor: Palette.ink,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  errorText: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Palette.inkMid,
  },
});