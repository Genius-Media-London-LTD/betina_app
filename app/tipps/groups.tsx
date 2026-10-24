import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import BackButton from '../../src/components/BackButton';
import GlowButton from '../../src/components/GlowButton';
import GlowCard from '../../src/components/GlowCard';
import ScreenBg from '../../src/components/ScreenBg';
import { Headline } from '../../src/components/Urban';
import { useI18n } from '../../src/lib/i18n';
import { TipGroup, createGroup, fetchMyGroups, joinGroup, leaveGroup } from '../../src/lib/tippspiel';
import { Colors, Fonts, Spacing, Typography } from '../../src/theme';

export default function GroupsScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [groups, setGroups] = useState<TipGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState<'create' | 'join' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setGroups(await fetchMyGroups());
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const errorText = (code: string) => ({
    group_not_found: t.tipGroupNotFound,
    too_many_groups: t.tipTooManyGroups,
    group_full: t.tipGroupFull,
  } as Record<string, string>)[code] ?? t.tipError;

  const open = (g: TipGroup) =>
    router.push({ pathname: '/tipps/ranking', params: { group: g.id, groupName: g.name, code: g.code } });

  const onCreate = async () => {
    if (name.trim().length < 2) return;
    setBusy('create');
    setError(null);
    const res = await createGroup(name.trim());
    setBusy(null);
    if (!res.ok) { setError(errorText(res.error)); return; }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setName('');
    await load();
    open(res.group);
  };

  const onJoin = async () => {
    if (code.trim().length < 4) return;
    setBusy('join');
    setError(null);
    const res = await joinGroup(code.trim());
    setBusy(null);
    if (!res.ok) { setError(errorText(res.error)); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); return; }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCode('');
    await load();
    open(res.group);
  };

  const onLeave = (g: TipGroup) => {
    const doLeave = async () => {
      await leaveGroup(g.id);
      load();
    };
    // RN-web's Alert ignores buttons, so confirm through the browser there.
    if (Platform.OS === 'web') {
      if (globalThis.confirm?.(`${t.tipLeave}: ${g.name}?`)) doLeave();
      return;
    }
    Alert.alert(t.tipLeave, g.name, [
      { text: t.tipCancel, style: 'cancel' },
      { text: t.tipLeave, style: 'destructive', onPress: doLeave },
    ]);
  };

  return (
    <ScreenBg>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <BackButton />
          <Headline text={t.tipGroups} size={34} accent="last" />
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 24 }} />
        ) : groups.length === 0 ? (
          <GlowCard style={styles.emptyCard}>
            <Text style={styles.emptyText}>{t.tipNoGroups}</Text>
          </GlowCard>
        ) : (
          groups.map((g, i) => (
            <Animated.View key={g.id} entering={FadeInDown.delay(i * 40).duration(350)}>
              <Pressable onPress={() => open(g)}>
                <GlowCard style={styles.groupCard}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.groupName} numberOfLines={1}>{g.name}</Text>
                    <Text style={styles.groupMeta}>{g.members} {t.tipMembers} · {g.code}</Text>
                  </View>
                  <Pressable onPress={() => onLeave(g)} hitSlop={8} style={styles.leaveBtn}>
                    <Text style={styles.leaveText}>×</Text>
                  </Pressable>
                  <Text style={styles.chevron}>→</Text>
                </GlowCard>
              </Pressable>
            </Animated.View>
          ))
        )}

        {error && <Text style={styles.error}>{error}</Text>}

        {/* Join with a code */}
        <GlowCard style={styles.formCard}>
          <Text style={styles.formTitle}>{t.tipJoinGroup}</Text>
          <TextInput
            value={code}
            onChangeText={(v) => setCode(v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
            placeholder={t.tipCodePlaceholder}
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="characters"
            autoCorrect={false}
            style={[styles.input, styles.codeInput]}
            onSubmitEditing={onJoin}
          />
          <GlowButton label={t.tipJoinGroup} onPress={onJoin} loading={busy === 'join'} disabled={code.length < 4} />
        </GlowCard>

        {/* Create a group */}
        <GlowCard style={styles.formCard}>
          <Text style={styles.formTitle}>{t.tipCreateGroup}</Text>
          <TextInput
            value={name}
            onChangeText={(v) => setName(v.slice(0, 40))}
            placeholder={t.tipGroupName}
            placeholderTextColor={Colors.textMuted}
            style={styles.input}
            onSubmitEditing={onCreate}
          />
          <GlowButton label={t.tipCreateGroup} onPress={onCreate} loading={busy === 'create'} disabled={name.trim().length < 2} />
        </GlowCard>
      </ScrollView>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: Spacing.lg, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  emptyCard: { padding: 20, alignItems: 'center', gap: 8 },
  emptyText: { color: Colors.textPrimary, fontSize: Typography.base, fontFamily: Fonts.medium, textAlign: 'center', lineHeight: 22 },
  groupCard: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  groupName: { color: Colors.white, fontSize: 20, fontFamily: Fonts.label, textTransform: 'uppercase', letterSpacing: 0.4 },
  groupMeta: { color: Colors.textMuted, fontSize: 11, fontFamily: Fonts.mono, letterSpacing: 0.8, textTransform: 'uppercase' },
  leaveBtn: {
    width: 30, height: 30, borderRadius: 0, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.glass, borderWidth: 1, borderColor: Colors.glassBorder,
  },
  leaveText: { color: Colors.textMuted, fontSize: Typography.sm, fontFamily: Fonts.bold },
  chevron: { color: Colors.primary, fontSize: 18, fontFamily: Fonts.label },
  error: { color: Colors.danger, fontSize: Typography.sm, fontFamily: Fonts.semibold, textAlign: 'center' },
  formCard: { padding: 16, gap: 10 },
  formTitle: { color: Colors.white, fontSize: 24, fontFamily: Fonts.display, textTransform: 'uppercase' },
  input: {
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border,
    color: Colors.white, fontSize: 16, fontFamily: Fonts.semibold, paddingHorizontal: 14, paddingVertical: 13,
  },
  codeInput: { letterSpacing: 3 },
});
