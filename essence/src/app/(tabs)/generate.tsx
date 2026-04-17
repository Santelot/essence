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

import { Fonts, Palette, Radius, Spacing } from '@/constants/theme';
import { ClaudeError, generateArticle } from '@/lib/claude';
import { createArticle } from '@/lib/db';
import type { MediaType } from '@/types';

const MEDIA_TYPES: MediaType[] = ['book', 'film', 'album', 'essay', 'course'];

export default function GenerateScreen() {
  const router = useRouter();

  const [mediaType, setMediaType] = useState<MediaType>('book');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [year, setYear] = useState('');
  const [genre, setGenre] = useState('');
  const [toneNotes, setToneNotes] = useState('');
  const [focusNotes, setFocusNotes] = useState('');

  const [generating, setGenerating] = useState(false);

  const canGenerate = title.trim().length > 0 && !generating;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setGenerating(true);
    try {
      const result = await generateArticle({
        mediaType,
        title: title.trim(),
        author: author.trim() || undefined,
        year: year.trim() || undefined,
        genre: genre.trim() || undefined,
        toneNotes: toneNotes.trim() || undefined,
        focusNotes: focusNotes.trim() || undefined,
      });

      const saved = await createArticle({
        title: title.trim(),
        source: title.trim(),
        author: author.trim() || null,
        mediaType,
        genre: genre.trim() || null,
        html: result.html,
        wordCount: result.wordCount,
      });

      // Reset the form for next time.
      setTitle('');
      setAuthor('');
      setYear('');
      setGenre('');
      setToneNotes('');
      setFocusNotes('');

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
          <Text style={styles.kicker}>GENERATING</Text>
          <Text style={styles.title}>Writing your article</Text>
        </View>
        <View style={styles.generatingBody}>
          <ActivityIndicator color={Palette.blueLight} size="large" />
          <Text style={styles.generatingTitle}>Reading, thinking, writing…</Text>
          <Text style={styles.generatingBodyText}>
            This typically takes 30–60 seconds. Long, beautiful articles are
            worth the wait.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.kicker}>GENERATE</Text>
        <Text style={styles.title}>New article</Text>
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
            {MEDIA_TYPES.map((t) => (
              <Pressable
                key={t}
                onPress={() => setMediaType(t)}
                style={({ pressed }) => [
                  styles.typePill,
                  mediaType === t && styles.typePillActive,
                  pressed && styles.pressed,
                ]}>
                <Text
                  style={[
                    styles.typePillText,
                    mediaType === t && styles.typePillTextActive,
                  ]}>
                  {t}
                </Text>
              </Pressable>
            ))}
          </View>

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

          <Pressable
            onPress={handleGenerate}
            disabled={!canGenerate}
            style={({ pressed }) => [
              styles.generateButton,
              !canGenerate && styles.disabled,
              pressed && styles.pressed,
            ]}>
            <Text style={styles.generateButtonText}>Generate article</Text>
          </Pressable>

          <Text style={styles.footnote}>
            Uses claude-sonnet-4 with your Anthropic API key. Generation usually
            takes 30–60 seconds.
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
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>
        {label}
        {required && <Text style={styles.requiredMark}> *</Text>}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Palette.inkSoft}
        style={[styles.input, multiline && styles.inputMultiline]}
        autoCapitalize={label === 'TITLE' ? 'words' : 'sentences'}
        autoCorrect={!multiline ? false : true}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        keyboardType={keyboardType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
  content: {
    padding: Spacing.three,
    paddingBottom: Spacing.six,
  },
  sectionLabel: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    letterSpacing: 2,
    color: Palette.inkMid,
    marginBottom: Spacing.two,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  typePill: {
    paddingVertical: 6,
    paddingHorizontal: Spacing.three,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Palette.line,
    backgroundColor: Palette.surface,
  },
  typePillActive: {
    backgroundColor: Palette.blue,
    borderColor: Palette.blue,
  },
  typePillText: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    letterSpacing: 1.5,
    color: Palette.inkMid,
    textTransform: 'uppercase',
  },
  typePillTextActive: {
    color: Palette.mist,
  },
  field: {
    marginBottom: Spacing.three,
  },
  fieldLabel: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    letterSpacing: 2,
    color: Palette.inkMid,
    marginBottom: Spacing.one,
  },
  requiredMark: {
    color: Palette.amber,
  },
  input: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    color: Palette.mist,
    backgroundColor: Palette.surface,
    borderColor: Palette.line,
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    minHeight: 42,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: Spacing.two,
  },
  generateButton: {
    marginTop: Spacing.two,
    backgroundColor: Palette.blue,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateButtonText: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    fontWeight: '600',
    color: Palette.mist,
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.85,
  },
  footnote: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Palette.inkSoft,
    textAlign: 'center',
    marginTop: Spacing.three,
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
    fontSize: 22,
    color: Palette.mist,
    marginTop: Spacing.three,
    marginBottom: Spacing.two,
    textAlign: 'center',
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
