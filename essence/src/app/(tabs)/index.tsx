import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassCard } from '@/components/glass-card';
import {
  BottomTabInset,
  Fonts,
  Palette,
  Radius,
  Spacing,
  TypeAccents,
} from '@/constants/theme';
import { deleteArticle, getAllArticles } from '@/lib/db';
import { useOnlineStatus } from '@/lib/network';
import type { Article } from '@/types';

type SortMode = 'newest' | 'oldest' | 'unread' | 'longest' | 'alpha';

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'unread', label: 'Unread' },
  { value: 'longest', label: 'Longest' },
  { value: 'alpha', label: 'A–Z' },
];

export default function LibraryScreen() {
  const router = useRouter();
  const online = useOnlineStatus();
  const [articles, setArticles] = useState<Article[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('newest');

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

  const sortedArticles = useMemo(() => {
    if (!articles) return null;
    const copy = [...articles];
    switch (sortMode) {
      case 'newest':
        return copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      case 'oldest':
        return copy.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      case 'unread':
        // Unread first; within each bucket, newest first.
        return copy.sort((a, b) => {
          const aUnread = a.readAt === null ? 0 : 1;
          const bUnread = b.readAt === null ? 0 : 1;
          if (aUnread !== bUnread) return aUnread - bUnread;
          return b.createdAt.localeCompare(a.createdAt);
        });
      case 'longest':
        return copy.sort((a, b) => (b.wordCount ?? 0) - (a.wordCount ?? 0));
      case 'alpha':
        return copy.sort((a, b) =>
          a.title.toLowerCase().localeCompare(b.title.toLowerCase())
        );
    }
  }, [articles, sortMode]);

  const handleLongPress = (article: Article) => {
    Alert.alert(
      article.title,
      'What would you like to do?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => confirmDelete(article),
        },
      ],
      { cancelable: true }
    );
  };

  const confirmDelete = (article: Article) => {
    Alert.alert(
      'Delete article?',
      `"${article.title}" will be removed from this device and the cloud.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteArticle(article.id);
              await load();
            } catch (err) {
              console.error('Library: delete failed', err);
              Alert.alert('Could not delete', 'Try again.');
            }
          },
        },
      ]
    );
  };

  if (sortedArticles === null) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loading}>
          <ActivityIndicator color={Palette.glow} />
        </View>
      </SafeAreaView>
    );
  }

  const unreadCount = sortedArticles.filter((a) => a.readAt === null).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text style={styles.kicker}>LIBRARY</Text>
          {!online && (
            <View style={styles.offlineBadge}>
              <View style={styles.offlineDot} />
              <Text style={styles.offlineText}>OFFLINE</Text>
            </View>
          )}
        </View>
        <Text style={styles.brand}>Essence</Text>
        <Text style={styles.count}>
          {sortedArticles.length}{' '}
          {sortedArticles.length === 1 ? 'article' : 'articles'}
          {unreadCount > 0 && (
            <Text style={styles.countUnread}> · {unreadCount} unread</Text>
          )}
        </Text>
      </View>

      {error && (
        <View style={styles.errorBar}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={sortedArticles}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          sortedArticles.length > 0 ? (
            <SortBar mode={sortMode} onChange={setSortMode} />
          ) : null
        }
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
            onLongPress={() => handleLongPress(item)}
          />
        )}
      />
    </SafeAreaView>
  );
}

function SortBar({
  mode,
  onChange,
}: {
  mode: SortMode;
  onChange: (m: SortMode) => void;
}) {
  return (
    <View style={styles.sortBar}>
      <FlatList
        horizontal
        data={SORT_OPTIONS}
        keyExtractor={(item) => item.value}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sortRow}
        renderItem={({ item }) => {
          const active = mode === item.value;
          return (
            <Pressable
              onPress={() => onChange(item.value)}
              style={({ pressed }) => [
                styles.sortChip,
                active && styles.sortChipActive,
                pressed && styles.sortChipPressed,
              ]}>
              <Text
                style={[
                  styles.sortChipText,
                  active && styles.sortChipTextActive,
                ]}>
                {item.label}
              </Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

function ArticleCard({
  article,
  onPress,
  onLongPress,
}: {
  article: Article;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const isUnread = article.readAt === null;
  const accent = TypeAccents[article.mediaType];
  const accentColor = isUnread ? accent.vivid : accent.dim;
  const minutes =
    article.wordCount !== null
      ? Math.max(1, Math.ceil(article.wordCount / 250))
      : null;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={400}
      style={({ pressed }) => [pressed && styles.cardPressed]}>
      <GlassCard variant={isUnread ? 'warm' : 'cool'} radius="lg">
        <View style={styles.cardLayout}>
          {/* Left-edge accent strip, colored per media type */}
          <View
            style={[
              styles.typeStripe,
              { backgroundColor: accentColor },
            ]}
          />
          <View style={styles.cardInner}>
            <View style={styles.cardTopRow}>
              <Text
                style={[
                  styles.cardMediaType,
                  { color: accentColor },
                ]}>
                {article.mediaType.toUpperCase()}
              </Text>
              {isUnread && (
                <View
                  style={[
                    styles.unreadDot,
                    { backgroundColor: accentColor },
                  ]}
                />
              )}
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
          </View>
        </View>
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.ink },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.four,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.one,
  },
  kicker: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    letterSpacing: 2.8,
    color: Palette.inkMid,
    fontWeight: '600',
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 209, 102, 0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 209, 102, 0.3)',
  },
  offlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.amber,
  },
  offlineText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 1.5,
    color: Palette.amber,
    fontWeight: '700',
  },
  brand: {
    fontFamily: Fonts.serif,
    fontSize: 44,
    color: Palette.mist,
    lineHeight: 48,
    letterSpacing: -0.5,
    fontWeight: '500',
  },
  count: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    color: Palette.inkMid,
    marginTop: Spacing.two,
    letterSpacing: 0.8,
  },
  countUnread: {
    color: Palette.ember,
    fontWeight: '600',
  },
  errorBar: {
    marginHorizontal: Spacing.four,
    marginTop: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(255, 69, 58, 0.1)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 69, 58, 0.3)',
  },
  errorText: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Palette.error,
  },
  list: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  separator: {
    height: Spacing.three,
  },
  sortBar: {
    marginBottom: Spacing.three,
    marginHorizontal: -Spacing.four,
  },
  sortRow: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  sortChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.line,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  sortChipActive: {
    backgroundColor: Palette.glow,
    borderColor: Palette.glow,
  },
  sortChipPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
  sortChipText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Palette.inkMid,
    letterSpacing: 1.2,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  sortChipTextActive: {
    color: Palette.ink,
    fontWeight: '700',
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.985 }],
  },
  cardLayout: {
    flexDirection: 'row',
  },
  typeStripe: {
    width: 3,
    alignSelf: 'stretch',
  },
  cardInner: {
    flex: 1,
    padding: Spacing.four,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  cardMediaType: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 2.2,
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardTitle: {
    fontFamily: Fonts.serif,
    fontSize: 24,
    color: Palette.mist,
    lineHeight: 30,
    letterSpacing: -0.3,
    marginBottom: Spacing.two,
    fontWeight: '500',
  },
  cardSource: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Palette.inkMid,
    marginBottom: Spacing.two,
  },
  cardMeta: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Palette.inkSoft,
    letterSpacing: 0.5,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six,
  },
  emptyTitle: {
    fontFamily: Fonts.serif,
    fontSize: 22,
    color: Palette.mist,
    marginBottom: Spacing.two,
  },
  emptyBody: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Palette.inkMid,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
});
