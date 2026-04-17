import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
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
import { clearApiKey, getApiKey, setApiKey } from '../../lib/secure-store';

export default function SettingsScreen() {
  const [loading, setLoading] = useState(true);
  const [existingKey, setExistingKey] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const key = await getApiKey();
      setExistingKey(key);
      // If nothing stored, open the editor by default.
      setEditing(!key);
    } catch (err) {
      console.error('Settings: load failed', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleSave = async () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      Alert.alert('Missing key', 'Paste an Anthropic API key to continue.');
      return;
    }
    setSaving(true);
    try {
      await setApiKey(trimmed);
      setExistingKey(trimmed);
      setDraft('');
      setEditing(false);
    } catch (err) {
      console.error('Settings: save failed', err);
      Alert.alert('Could not save', 'Something went wrong. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    Alert.alert(
      'Remove API key?',
      'You will need to paste it again to generate new articles.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearApiKey();
              setExistingKey(null);
              setDraft('');
              setEditing(true);
            } catch (err) {
              console.error('Settings: clear failed', err);
              Alert.alert('Could not remove', 'Try again.');
            }
          },
        },
      ]
    );
  };

  const maskKey = (k: string) => {
    if (k.length <= 10) return '•'.repeat(k.length);
    return `${k.slice(0, 7)}${'•'.repeat(12)}${k.slice(-4)}`;
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.kicker}>SETTINGS</Text>
        <Text style={styles.title}>Configuration</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled">
          <Text style={styles.sectionLabel}>ANTHROPIC API KEY</Text>

          {loading ? (
            <View style={styles.loadingBlock}>
              <ActivityIndicator color={Palette.blueLight} />
            </View>
          ) : existingKey && !editing ? (
            <View style={styles.card}>
              <Text style={styles.maskedKey}>{maskKey(existingKey)}</Text>
              <Text style={styles.helper}>
                Stored securely on this device only.
              </Text>
              <View style={styles.buttonRow}>
                <Pressable
                  onPress={() => {
                    setDraft('');
                    setEditing(true);
                  }}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    pressed && styles.pressed,
                  ]}>
                  <Text style={styles.secondaryButtonText}>Replace</Text>
                </Pressable>
                <Pressable
                  onPress={handleClear}
                  style={({ pressed }) => [
                    styles.dangerButton,
                    pressed && styles.pressed,
                  ]}>
                  <Text style={styles.dangerButtonText}>Remove</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.card}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="sk-ant-..."
                placeholderTextColor={Palette.inkSoft}
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
                editable={!saving}
              />
              <Text style={styles.helper}>
                Get a key at console.anthropic.com. Stored securely on this
                device — never synced anywhere.
              </Text>
              <View style={styles.buttonRow}>
                {existingKey && (
                  <Pressable
                    onPress={() => {
                      setDraft('');
                      setEditing(false);
                    }}
                    style={({ pressed }) => [
                      styles.secondaryButton,
                      pressed && styles.pressed,
                    ]}>
                    <Text style={styles.secondaryButtonText}>Cancel</Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={handleSave}
                  disabled={saving || !draft.trim()}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    (saving || !draft.trim()) && styles.disabled,
                    pressed && styles.pressed,
                  ]}>
                  {saving ? (
                    <ActivityIndicator color={Palette.mist} />
                  ) : (
                    <Text style={styles.primaryButtonText}>Save</Text>
                  )}
                </Pressable>
              </View>
            </View>
          )}

          <Text style={[styles.sectionLabel, styles.nextSection]}>
            CLOUD SYNC
          </Text>
          <View style={styles.card}>
            <Text style={styles.placeholder}>
              Supabase configuration arrives in Phase 3.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  nextSection: {
    marginTop: Spacing.five,
  },
  card: {
    backgroundColor: Palette.surface,
    borderColor: Palette.line,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.three,
  },
  loadingBlock: {
    paddingVertical: Spacing.five,
    alignItems: 'center',
  },
  maskedKey: {
    fontFamily: Fonts.mono,
    fontSize: 16,
    color: Palette.mist,
    marginBottom: Spacing.two,
    letterSpacing: 1,
  },
  helper: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Palette.inkMid,
    marginBottom: Spacing.three,
    lineHeight: 18,
  },
  input: {
    fontFamily: Fonts.mono,
    fontSize: 14,
    color: Palette.mist,
    backgroundColor: Palette.void,
    borderColor: Palette.line,
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    marginBottom: Spacing.two,
    minHeight: 42,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: Palette.blue,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  primaryButtonText: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    fontWeight: '600',
    color: Palette.mist,
  },
  secondaryButton: {
    flex: 1,
    borderColor: Palette.line,
    borderWidth: 1,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  secondaryButtonText: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    fontWeight: '500',
    color: Palette.mist,
  },
  dangerButton: {
    flex: 1,
    borderColor: Palette.error,
    borderWidth: 1,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  dangerButtonText: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    fontWeight: '500',
    color: Palette.error,
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.8,
  },
  placeholder: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Palette.inkMid,
  },
});
