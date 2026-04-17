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
import type { Article } from '@/types';

export default function LibraryScreen() {
  const router = useRouter();
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

  // Reload on focus so newly-generated or newly-read articles appear.
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
              router.push({ pathname: '/reader/[id]' as any, params: { id: item.id } })
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
    article.wordCount !== null ? Math.max(1, Math.ceil(article.wordCount / 250)) : null;

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
        {article.author ? `${article.author} · ${article.source}` : article.source}
      </Text>
      <View style={styles.cardBottomRow}>
        {minutes !== null && (
          <Text style={styles.cardMeta}>{minutes} MIN READ</Text>
        )}
        {article.readProgress > 0 && article.readProgress < 1 && (
          <Text style={styles.cardMeta}>
            {Math.round(article.readProgress * 100)}%
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Palette.deep,
  },
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
    fontSize: 11,
    letterSpacing: 1,
    color: Palette.inkSoft,
    marginTop: Spacing.two,
  },
  errorBar: {
    backgroundColor: Palette.error,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  errorText: {
    color: Palette.mist,
    fontFamily: Fonts.sans,
    fontSize: 13,
  },
  list: {
    padding: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
    flexGrow: 1,
  },
  separator: {
    height: Spacing.three,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six,
    gap: Spacing.two,
  },
  emptyTitle: {
    fontFamily: Fonts.serif,
    fontSize: 20,
    color: Palette.mist,
  },
  emptyBody: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Palette.inkMid,
    textAlign: 'center',
  },
  card: {
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.line,
    borderRadius: Radius.md,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  cardPressed: {
    opacity: 0.7,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardMediaType: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 1.8,
    color: Palette.cyan,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Palette.blueLight,
  },
  cardTitle: {
    fontFamily: Fonts.serif,
    fontSize: 20,
    lineHeight: 26,
    color: Palette.mist,
  },
  cardSource: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Palette.inkMid,
  },
  cardBottomRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
  cardMeta: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 1.2,
    color: Palette.inkSoft,
  },
});
