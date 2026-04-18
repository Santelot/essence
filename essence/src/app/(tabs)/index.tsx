import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  BottomTabInset,
  Fonts,
  Palette,
  Radius,
  Spacing,
} from '@/constants/theme';
import { getAllArticles } from '@/lib/db';
import { useOnlineStatus } from '@/lib/network';
import type { Article } from '@/types';

export default function LibraryScreen() {
  const router = useRouter();
  const online = useOnlineStatus();
  const [articles, setArticles] = useState<Article[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const all = await getAllArticles();
      setArticles(all);
    } catch (err) {
      console.error('Library: failed to load', err);
      setError('Could not load your library.');
      setArticles([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (articles === null) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loading}>
          <ActivityIndicator color={Palette.blueLight} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.kicker}>LIBRARY</Text>
        <Text style={styles.brand}>Essence</Text>
        <Text style={styles.count}>
          {articles.length} {articles.length === 1 ? 'article' : 'articles'}
          {!online && <Text style={styles.offline}> · offline</Text>}
        </Text>
      </View>

      {error && (
        <View style={styles.errorBar}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={articles}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Nothing here yet</Text>
            <Text style={styles.emptyBody}>
              Generate your first article from the Generate tab.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <ArticleCard
            article={item}
            onPress={() =>
              router.push({
                pathname: '/reader/[id]' as any,
                params: { id: item.id },
              })
            }
          />
        )}
      />
    </SafeAreaView>
  );
}

function ArticleCard({
  article,
  onPress,
}: {
  article: Article;
  onPress: () => void;
}) {
  const isUnread = article.readAt === null;
  const minutes =
    article.wordCount !== null
      ? Math.max(1, Math.ceil(article.wordCount / 250))
      : null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <View style={styles.cardTopRow}>
        <Text style={styles.cardMediaType}>{article.mediaType.toUpperCase()}</Text>
        {isUnread && <View style={styles.unreadDot} />}
      </View>
      <Text style={styles.cardTitle} numberOfLines={2}>
        {article.title}
      </Text>
      <Text style={styles.cardSource} numberOfLines={1}>
        {article.author ?? article.source}
      </Text>
      {minutes !== null && (
        <Text style={styles.cardMeta}>
          {minutes} min · {article.wordCount?.toLocaleString()} words
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.deep },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  brand: {
    fontFamily: Fonts.serif,
    fontSize: 36,
    color: Palette.mist,
    lineHeight: 42,
  },
  count: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    color: Palette.inkMid,
    marginTop: Spacing.one,
    letterSpacing: 1,
  },
  offline: {
    color: Palette.amber,
  },
  errorBar: {
    backgroundColor: Palette.surface,
    borderColor: Palette.error,
    borderWidth: 1,
    marginHorizontal: Spacing.three,
    marginTop: Spacing.two,
    padding: Spacing.two,
    borderRadius: Radius.sm,
  },
  errorText: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Palette.error,
  },
  list: {
    padding: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  separator: {
    height: Spacing.three,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.four,
  },
  emptyTitle: {
    fontFamily: Fonts.serif,
    fontSize: 20,
    color: Palette.mist,
    marginBottom: Spacing.two,
  },
  emptyBody: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Palette.inkMid,
    textAlign: 'center',
  },
  card: {
    backgroundColor: Palette.surface,
    borderColor: Palette.line,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.three,
  },
  cardPressed: {
    opacity: 0.85,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  cardMediaType: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
    color: Palette.blueLight,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Palette.cyan,
  },
  cardTitle: {
    fontFamily: Fonts.serif,
    fontSize: 22,
    color: Palette.mist,
    lineHeight: 28,
    marginBottom: Spacing.one,
  },
  cardSource: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Palette.inkMid,
    marginBottom: Spacing.one,
  },
  cardMeta: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Palette.inkSoft,
    letterSpacing: 0.5,
  },
});
