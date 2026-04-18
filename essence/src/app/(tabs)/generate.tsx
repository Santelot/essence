import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
import { ClaudeError, generateArticle } from '@/lib/claude';
import { createArticle } from '@/lib/db';
import type { MediaType, TopicDepth } from '@/types';

const MEDIA_TYPES: MediaType[] = [
  'book',
  'film',
  'album',
  'essay',
  'course',
  'topic',
];

const DEPTHS: { value: TopicDepth; label: string; hint: string }[] = [
  { value: 'primer', label: 'Primer', hint: 'shorter, intro-friendly' },
  { value: 'standard', label: 'Standard', hint: 'deep, comprehensive' },
  { value: 'deep', label: 'Deep', hint: 'as long as needed' },
];

export default function GenerateScreen() {
  const router = useRouter();

  const [mediaType, setMediaType] = useState<MediaType>('book');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [year, setYear] = useState('');
  const [genre, setGenre] = useState('');
  const [toneNotes, setToneNotes] = useState('');
  const [focusNotes, setFocusNotes] = useState('');
  const [depth, setDepth] = useState<TopicDepth>('standard');

  const [generating, setGenerating] = useState(false);

  const isTopicMode = mediaType === 'topic';
  const canGenerate = title.trim().length > 0 && !generating;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setGenerating(true);
    try {
      const result = await generateArticle({
        mediaType,
        title: title.trim(),
        author: !isTopicMode ? author.trim() || undefined : undefined,
        year: !isTopicMode ? year.trim() || undefined : undefined,
        genre: !isTopicMode ? genre.trim() || undefined : undefined,
        toneNotes: toneNotes.trim() || undefined,
        focusNotes: focusNotes.trim() || undefined,
        depth: isTopicMode ? depth : undefined,
      });

      const saved = await createArticle({
        title: title.trim(),
        source: title.trim(),
        author: !isTopicMode ? author.trim() || null : null,
        mediaType,
        genre: !isTopicMode ? genre.trim() || null : null,
        html: result.html,
        wordCount: result.wordCount,
      });

      setTitle('');
      setAuthor('');
      setYear('');
      setGenre('');
      setToneNotes('');
      setFocusNotes('');
      setDepth('standard');

      router.push({
        pathname: '/reader/[id]' as any,
        params: { id: saved.id },
      });
    } catch (err) {
      if (err instanceof ClaudeError) {
        if (err.code === 'NO_KEY') {
          Alert.alert('No API key', err.message, [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Go to Settings',
              onPress: () => router.push('/settings' as any),
            },
          ]);
        } else {
          Alert.alert('Generation failed', err.message);
        }
      } else {
        console.error('Generate: unexpected error', err);
        Alert.alert('Something went wrong', 'Please try again.');
      }
    } finally {
      setGenerating(false);
    }
  };

  if (generating) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.kickerWarm}>GENERATING</Text>
          <Text style={styles.title}>Writing your article</Text>
        </View>
        <View style={styles.generatingBody}>
          <ActivityIndicator color={Palette.ember} size="large" />
          <Text style={styles.generatingTitle}>Reading, thinking, writing…</Text>
          <Text style={styles.generatingBodyText}>
            This typically takes 30–90 seconds. Long, beautiful articles are
            worth the wait.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.kickerWarm}>GENERATE</Text>
        <Text style={styles.title}>
          {isTopicMode ? 'Explore a topic' : 'New article'}
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled">
          <Text style={styles.sectionLabel}>TYPE</Text>
          <View style={styles.typeRow}>
            {MEDIA_TYPES.map((t) => {
              const accent = TypeAccents[t];
              const active = mediaType === t;
              return (
                <Pressable
                  key={t}
                  onPress={() => setMediaType(t)}
                  style={({ pressed }) => [pressed && styles.pressed]}>
                  <GlassCard
                    variant={active ? 'warm' : 'cool'}
                    strong={active}
                    radius="md">
                    <View
                      style={[
                        styles.typePillInner,
                        active && { borderColor: accent.vivid },
                      ]}>
                      <Text
                        style={[
                          styles.typePillText,
                          active && { color: accent.vivid, fontWeight: '700' },
                        ]}>
                        {t}
                      </Text>
                    </View>
                  </GlassCard>
                </Pressable>
              );
            })}
          </View>

          {isTopicMode ? (
            <>
              <Field
                label="TOPIC"
                required
                value={title}
                onChangeText={setTitle}
                placeholder="the physics of black holes"
              />

              <Text style={[styles.sectionLabel, { marginTop: Spacing.two }]}>
                DEPTH
              </Text>
              <View style={styles.depthRow}>
                {DEPTHS.map((d) => {
                  const active = depth === d.value;
                  return (
                    <Pressable
                      key={d.value}
                      onPress={() => setDepth(d.value)}
                      style={({ pressed }) => [
                        styles.depthCell,
                        pressed && styles.pressed,
                      ]}>
                      <GlassCard
                        variant={active ? 'warm' : 'cool'}
                        strong={active}
                        radius="md">
                        <View style={styles.depthInner}>
                          <Text
                            style={[
                              styles.depthLabel,
                              active && styles.depthLabelActive,
                            ]}>
                            {d.label}
                          </Text>
                          <Text style={styles.depthHint}>{d.hint}</Text>
                        </View>
                      </GlassCard>
                    </Pressable>
                  );
                })}
              </View>

              <Field
                label="WHAT I WANT TO UNDERSTAND"
                value={focusNotes}
                onChangeText={setFocusNotes}
                placeholder="how event horizons work; why Hawking radiation matters"
                multiline
              />
              <Field
                label="TONE NOTES"
                value={toneNotes}
                onChangeText={setToneNotes}
                placeholder="rigorous but playful; assume I know basic physics"
                multiline
              />
            </>
          ) : (
            <>
              <Field
                label="TITLE"
                required
                value={title}
                onChangeText={setTitle}
                placeholder="The Design of Everyday Things"
              />
              <Field
                label="AUTHOR"
                value={author}
                onChangeText={setAuthor}
                placeholder="Don Norman"
              />
              <Field
                label="YEAR"
                value={year}
                onChangeText={setYear}
                placeholder="1988"
                keyboardType="number-pad"
              />
              <Field
                label="GENRE"
                value={genre}
                onChangeText={setGenre}
                placeholder="design · psychology"
              />
              <Field
                label="TONE NOTES"
                value={toneNotes}
                onChangeText={setToneNotes}
                placeholder="playful, precise, a little irreverent"
                multiline
              />
              <Field
                label="WHAT I WANT TO UNDERSTAND"
                value={focusNotes}
                onChangeText={setFocusNotes}
                placeholder="the three levels of design; how affordances work"
                multiline
              />
            </>
          )}

          <Pressable
            onPress={handleGenerate}
            disabled={!canGenerate}
            style={({ pressed }) => [
              styles.generateButton,
              !canGenerate && styles.disabled,
              pressed && styles.pressed,
            ]}>
            <Text style={styles.generateButtonText}>
              {isTopicMode ? 'Explore topic' : 'Generate article'}
            </Text>
          </Pressable>

          <Text style={styles.footnote}>
            Uses claude-sonnet-4-6 with your Anthropic API key. Generation
            usually takes 30–90 seconds.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  multiline?: boolean;
  keyboardType?: 'default' | 'number-pad';
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  required,
  multiline,
  keyboardType,
}: FieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>
        {label}
        {required && <Text style={styles.requiredMark}> *</Text>}
      </Text>
      <GlassCard variant={focused ? 'warm' : 'cool'} radius="sm">
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          placeholderTextColor={Palette.inkSoft}
          style={[styles.input, multiline && styles.inputMultiline]}
          autoCapitalize={
            label === 'TITLE' || label === 'TOPIC' ? 'words' : 'sentences'
          }
          autoCorrect={!!multiline}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
          keyboardType={keyboardType}
        />
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: Palette.ink },
  header: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.four,
  },
  kickerWarm: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    letterSpacing: 2.8,
    color: Palette.ember,
    fontWeight: '700',
    marginBottom: Spacing.one,
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 38,
    color: Palette.mist,
    lineHeight: 44,
    letterSpacing: -0.5,
    fontWeight: '500',
  },
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  sectionLabel: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 2.2,
    color: Palette.inkMid,
    marginBottom: Spacing.two,
    fontWeight: '600',
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  typePillInner: {
    paddingVertical: 8,
    paddingHorizontal: Spacing.three,
  },
  typePillText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    letterSpacing: 1.8,
    color: Palette.inkMid,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  depthRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  depthCell: {
    flex: 1,
  },
  depthInner: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
    alignItems: 'center',
  },
  depthLabel: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Palette.inkMid,
    fontWeight: '600',
    marginBottom: 2,
  },
  depthLabelActive: {
    color: Palette.ember,
    fontWeight: '700',
  },
  depthHint: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Palette.inkSoft,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  field: {
    marginBottom: Spacing.three,
  },
  fieldLabel: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
    color: Palette.inkMid,
    marginBottom: Spacing.two,
    fontWeight: '600',
  },
  requiredMark: {
    color: Palette.ember,
  },
  input: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    color: Palette.mist,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    minHeight: 48,
  },
  inputMultiline: {
    minHeight: 90,
    textAlignVertical: 'top',
    paddingTop: Spacing.three,
  },
  generateButton: {
    marginTop: Spacing.three,
    backgroundColor: Palette.ember,
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Palette.ember,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  generateButtonText: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    fontWeight: '700',
    color: Palette.ink,
    letterSpacing: 0.3,
  },
  disabled: {
    opacity: 0.35,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  footnote: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Palette.inkSoft,
    textAlign: 'center',
    marginTop: Spacing.four,
    lineHeight: 17,
  },
  generatingBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  generatingTitle: {
    fontFamily: Fonts.serif,
    fontSize: 24,
    color: Palette.mist,
    marginTop: Spacing.four,
    marginBottom: Spacing.two,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  generatingBodyText: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Palette.inkMid,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
  },
});
