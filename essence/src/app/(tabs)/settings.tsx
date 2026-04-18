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
import { clearApiKey, getApiKey, setApiKey } from '@/lib/secure-store';
import {
  clearSupabaseConfig,
  getSupabaseConfig,
  setSupabaseConfig,
  type SupabaseConfig,
} from '@/lib/supabase';
import { syncAll, type SyncStatus } from '@/lib/sync';

export default function SettingsScreen() {
  // --- API key state ---
  const [loading, setLoading] = useState(true);
  const [existingKey, setExistingKey] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState(false);
  const [keyDraft, setKeyDraft] = useState('');
  const [savingKey, setSavingKey] = useState(false);

  // --- Supabase state ---
  const [sbConfig, setSbConfig] = useState<SupabaseConfig | null>(null);
  const [editingSb, setEditingSb] = useState(false);
  const [sbUrlDraft, setSbUrlDraft] = useState('');
  const [sbKeyDraft, setSbKeyDraft] = useState('');
  const [savingSb, setSavingSb] = useState(false);

  // --- Sync state ---
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ type: 'idle' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [key, cfg] = await Promise.all([getApiKey(), getSupabaseConfig()]);
      setExistingKey(key);
      setEditingKey(!key);
      setSbConfig(cfg);
      setEditingSb(!cfg);
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

  // --- API key handlers ---

  const handleSaveKey = async () => {
    const trimmed = keyDraft.trim();
    if (!trimmed) {
      Alert.alert('Missing key', 'Paste an Anthropic API key to continue.');
      return;
    }
    setSavingKey(true);
    try {
      await setApiKey(trimmed);
      setExistingKey(trimmed);
      setKeyDraft('');
      setEditingKey(false);
    } catch (err) {
      console.error('Settings: save key failed', err);
      Alert.alert('Could not save', 'Something went wrong. Try again.');
    } finally {
      setSavingKey(false);
    }
  };

  const handleClearKey = () => {
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
              setKeyDraft('');
              setEditingKey(true);
            } catch (err) {
              console.error('Settings: clear key failed', err);
              Alert.alert('Could not remove', 'Try again.');
            }
          },
        },
      ]
    );
  };

  // --- Supabase handlers ---

  const handleSaveSb = async () => {
    const url = sbUrlDraft.trim();
    const anonKey = sbKeyDraft.trim();
    if (!url || !anonKey) {
      Alert.alert('Missing fields', 'Both the URL and the anon key are required.');
      return;
    }
    setSavingSb(true);
    try {
      await setSupabaseConfig({ url, anonKey });
      setSbConfig({ url: url.replace(/\/+$/, ''), anonKey });
      setSbUrlDraft('');
      setSbKeyDraft('');
      setEditingSb(false);
      // Fire a sync immediately so the user gets fast feedback.
      void handleSyncNow();
    } catch (err) {
      console.error('Settings: save Supabase config failed', err);
      Alert.alert(
        'Could not save',
        err instanceof Error ? err.message : 'Try again.'
      );
    } finally {
      setSavingSb(false);
    }
  };

  const handleClearSb = () => {
    Alert.alert(
      'Disconnect cloud sync?',
      'Local articles stay on this device. The cloud database is not deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearSupabaseConfig();
              setSbConfig(null);
              setSbUrlDraft('');
              setSbKeyDraft('');
              setEditingSb(true);
              setSyncStatus({ type: 'idle' });
            } catch (err) {
              console.error('Settings: clear Supabase failed', err);
              Alert.alert('Could not disconnect', 'Try again.');
            }
          },
        },
      ]
    );
  };

  const handleSyncNow = async () => {
    setSyncStatus({ type: 'syncing' });
    const result = await syncAll();
    setSyncStatus(result);
  };

  // --- Rendering helpers ---

  const maskKey = (k: string) => {
    if (k.length <= 10) return '•'.repeat(k.length);
    return `${k.slice(0, 7)}${'•'.repeat(12)}${k.slice(-4)}`;
  };

  const maskUrl = (u: string) => {
    // Show the subdomain, mask the rest. Useful to confirm it's the right project.
    try {
      const host = u.replace(/^https?:\/\//, '').split('/')[0];
      return host;
    } catch {
      return u;
    }
  };

  const syncStatusText = (): string => {
    switch (syncStatus.type) {
      case 'idle':
        return '';
      case 'syncing':
        return 'Syncing…';
      case 'success':
        return `Synced · ${syncStatus.pushed} sent, ${syncStatus.pulled} received`;
      case 'error':
        return `Sync failed: ${syncStatus.message}`;
      case 'skipped':
        return syncStatus.reason === 'offline'
          ? 'Offline — will sync when connected'
          : 'Connect Supabase above first';
    }
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
          {/* ---------- ANTHROPIC API KEY ---------- */}
          <Text style={styles.sectionLabel}>ANTHROPIC API KEY</Text>

          {loading ? (
            <View style={styles.loadingBlock}>
              <ActivityIndicator color={Palette.blueLight} />
            </View>
          ) : existingKey && !editingKey ? (
            <View style={styles.card}>
              <Text style={styles.maskedKey}>{maskKey(existingKey)}</Text>
              <Text style={styles.helper}>
                Stored securely on this device only.
              </Text>
              <View style={styles.buttonRow}>
                <Pressable
                  onPress={() => {
                    setKeyDraft('');
                    setEditingKey(true);
                  }}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    pressed && styles.pressed,
                  ]}>
                  <Text style={styles.secondaryButtonText}>Replace</Text>
                </Pressable>
                <Pressable
                  onPress={handleClearKey}
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
                value={keyDraft}
                onChangeText={setKeyDraft}
                placeholder="sk-ant-..."
                placeholderTextColor={Palette.inkSoft}
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
                editable={!savingKey}
              />
              <Text style={styles.helper}>
                Get a key at console.anthropic.com. Stored securely on this
                device — never synced anywhere.
              </Text>
              <View style={styles.buttonRow}>
                {existingKey && (
                  <Pressable
                    onPress={() => {
                      setKeyDraft('');
                      setEditingKey(false);
                    }}
                    style={({ pressed }) => [
                      styles.secondaryButton,
                      pressed && styles.pressed,
                    ]}>
                    <Text style={styles.secondaryButtonText}>Cancel</Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={handleSaveKey}
                  disabled={savingKey || !keyDraft.trim()}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    (savingKey || !keyDraft.trim()) && styles.disabled,
                    pressed && styles.pressed,
                  ]}>
                  {savingKey ? (
                    <ActivityIndicator color={Palette.mist} />
                  ) : (
                    <Text style={styles.primaryButtonText}>Save</Text>
                  )}
                </Pressable>
              </View>
            </View>
          )}

          {/* ---------- SUPABASE CLOUD SYNC ---------- */}
          <Text style={[styles.sectionLabel, styles.nextSection]}>
            CLOUD SYNC
          </Text>

          {loading ? null : sbConfig && !editingSb ? (
            <View style={styles.card}>
              <Text style={styles.maskedKey}>{maskUrl(sbConfig.url)}</Text>
              <Text style={styles.helper}>
                Connected. Articles sync when the app is opened or returns to
                the foreground.
              </Text>
              <View style={styles.buttonRow}>
                <Pressable
                  onPress={() => {
                    setSbUrlDraft('');
                    setSbKeyDraft('');
                    setEditingSb(true);
                  }}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    pressed && styles.pressed,
                  ]}>
                  <Text style={styles.secondaryButtonText}>Replace</Text>
                </Pressable>
                <Pressable
                  onPress={handleClearSb}
                  style={({ pressed }) => [
                    styles.dangerButton,
                    pressed && styles.pressed,
                  ]}>
                  <Text style={styles.dangerButtonText}>Disconnect</Text>
                </Pressable>
              </View>

              <Pressable
                onPress={handleSyncNow}
                disabled={syncStatus.type === 'syncing'}
                style={({ pressed }) => [
                  styles.syncButton,
                  syncStatus.type === 'syncing' && styles.disabled,
                  pressed && styles.pressed,
                ]}>
                {syncStatus.type === 'syncing' ? (
                  <ActivityIndicator color={Palette.mist} />
                ) : (
                  <Text style={styles.syncButtonText}>Sync now</Text>
                )}
              </Pressable>
              {!!syncStatusText() && (
                <Text
                  style={[
                    styles.syncStatusText,
                    syncStatus.type === 'error' && styles.syncStatusError,
                  ]}>
                  {syncStatusText()}
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.miniLabel}>PROJECT URL</Text>
              <TextInput
                value={sbUrlDraft}
                onChangeText={setSbUrlDraft}
                placeholder="https://xxxxx.supabase.co"
                placeholderTextColor={Palette.inkSoft}
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                editable={!savingSb}
              />
              <Text style={[styles.miniLabel, styles.miniLabelGap]}>
                ANON KEY
              </Text>
              <TextInput
                value={sbKeyDraft}
                onChangeText={setSbKeyDraft}
                placeholder="eyJ..."
                placeholderTextColor={Palette.inkSoft}
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
                editable={!savingSb}
              />
              <Text style={styles.helper}>
                Both values come from Project Settings → API in your Supabase
                dashboard. Stored securely on this device.
              </Text>
              <View style={styles.buttonRow}>
                {sbConfig && (
                  <Pressable
                    onPress={() => {
                      setSbUrlDraft('');
                      setSbKeyDraft('');
                      setEditingSb(false);
                    }}
                    style={({ pressed }) => [
                      styles.secondaryButton,
                      pressed && styles.pressed,
                    ]}>
                    <Text style={styles.secondaryButtonText}>Cancel</Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={handleSaveSb}
                  disabled={
                    savingSb || !sbUrlDraft.trim() || !sbKeyDraft.trim()
                  }
                  style={({ pressed }) => [
                    styles.primaryButton,
                    (savingSb || !sbUrlDraft.trim() || !sbKeyDraft.trim()) &&
                      styles.disabled,
                    pressed && styles.pressed,
                  ]}>
                  {savingSb ? (
                    <ActivityIndicator color={Palette.mist} />
                  ) : (
                    <Text style={styles.primaryButtonText}>Save</Text>
                  )}
                </Pressable>
              </View>
            </View>
          )}
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
    fontSize: 15,
    color: Palette.mist,
    marginBottom: Spacing.two,
    letterSpacing: 0.5,
  },
  miniLabel: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 1.8,
    color: Palette.inkMid,
    marginBottom: Spacing.one,
  },
  miniLabelGap: {
    marginTop: Spacing.two,
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
    marginBottom: Spacing.one,
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
  syncButton: {
    marginTop: Spacing.three,
    backgroundColor: Palette.cyan,
    paddingVertical: Spacing.two,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  syncButtonText: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    fontWeight: '600',
    color: Palette.mist,
  },
  syncStatusText: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    color: Palette.inkMid,
    marginTop: Spacing.two,
    textAlign: 'center',
  },
  syncStatusError: {
    color: Palette.error,
  },
});
