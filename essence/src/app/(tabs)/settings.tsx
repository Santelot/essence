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

import { GlassCard } from '@/components/glass-card';
import {
  BottomTabInset,
  Fonts,
  Palette,
  Radius,
  Spacing,
} from '@/constants/theme';
import { clearApiKey, getApiKey, setApiKey } from '@/lib/secure-store';
import {
  clearSupabaseConfig,
  getSupabaseConfig,
  setSupabaseConfig,
  type SupabaseConfig,
} from '@/lib/supabase';
import { syncAll, type SyncStatus } from '@/lib/sync';

export default function SettingsScreen() {
  const [loading, setLoading] = useState(true);
  const [existingKey, setExistingKey] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState(false);
  const [keyDraft, setKeyDraft] = useState('');
  const [savingKey, setSavingKey] = useState(false);

  const [sbConfig, setSbConfig] = useState<SupabaseConfig | null>(null);
  const [editingSb, setEditingSb] = useState(false);
  const [sbUrlDraft, setSbUrlDraft] = useState('');
  const [sbKeyDraft, setSbKeyDraft] = useState('');
  const [savingSb, setSavingSb] = useState(false);

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

  const maskKey = (k: string) => {
    if (k.length <= 10) return '•'.repeat(k.length);
    return `${k.slice(0, 7)}${'•'.repeat(12)}${k.slice(-4)}`;
  };

  const maskUrl = (u: string) => {
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
            <GlassCard radius="lg">
              <View style={styles.loadingBlock}>
                <ActivityIndicator color={Palette.glow} />
              </View>
            </GlassCard>
          ) : existingKey && !editingKey ? (
            <GlassCard radius="lg">
              <View style={styles.cardInner}>
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
            </GlassCard>
          ) : (
            <GlassCard radius="lg">
              <View style={styles.cardInner}>
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
                      <ActivityIndicator color={Palette.ink} />
                    ) : (
                      <Text style={styles.primaryButtonText}>Save</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            </GlassCard>
          )}

          {/* ---------- SUPABASE CLOUD SYNC ---------- */}
          <Text style={[styles.sectionLabel, styles.nextSection]}>
            CLOUD SYNC
          </Text>

          {loading ? null : sbConfig && !editingSb ? (
            <GlassCard radius="lg">
              <View style={styles.cardInner}>
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
            </GlassCard>
          ) : (
            <GlassCard radius="lg">
              <View style={styles.cardInner}>
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
                      <ActivityIndicator color={Palette.ink} />
                    ) : (
                      <Text style={styles.primaryButtonText}>Save</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            </GlassCard>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  kicker: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    letterSpacing: 2.8,
    color: Palette.inkMid,
    marginBottom: Spacing.one,
    fontWeight: '600',
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
  nextSection: {
    marginTop: Spacing.five,
  },
  cardInner: {
    padding: Spacing.four,
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
    fontWeight: '600',
  },
  miniLabelGap: {
    marginTop: Spacing.three,
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
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.line,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    marginBottom: Spacing.two,
    minHeight: 44,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: Palette.glow,
    paddingVertical: 12,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  primaryButtonText: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    fontWeight: '700',
    color: Palette.ink,
    letterSpacing: 0.3,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.line,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingVertical: 12,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  secondaryButtonText: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    fontWeight: '500',
    color: Palette.mist,
  },
  dangerButton: {
    flex: 1,
    borderColor: 'rgba(255, 69, 58, 0.4)',
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 69, 58, 0.08)',
    paddingVertical: 12,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  dangerButtonText: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    fontWeight: '500',
    color: Palette.error,
  },
  disabled: {
    opacity: 0.35,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  syncButton: {
    marginTop: Spacing.three,
    backgroundColor: Palette.ember,
    paddingVertical: 12,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    shadowColor: Palette.ember,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  syncButtonText: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    fontWeight: '700',
    color: Palette.ink,
    letterSpacing: 0.3,
  },
  syncStatusText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Palette.inkMid,
    marginTop: Spacing.two,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  syncStatusError: {
    color: Palette.error,
  },
});
