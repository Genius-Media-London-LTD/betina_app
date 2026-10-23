import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import BackButton from '../../src/components/BackButton';
import GlowButton from '../../src/components/GlowButton';
import ScreenBg from '../../src/components/ScreenBg';
import { Emblem } from '../../src/components/TipParts';
import { useI18n } from '../../src/lib/i18n';
import { Competition, fetchCompetitions, fetchMyCompetitions, setMyCompetitions } from '../../src/lib/tippspiel';
import { Colors, Fonts, Spacing, Typography } from '../../src/theme';

export default function CompetitionsScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [picked, setPicked] = useState<string[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([fetchCompetitions(), fetchMyCompetitions()]).then(([all, mine]) => {
      setCompetitions(all);
      setPicked(mine);
    });
  }, []);

  const toggle = (code: string) => {
    Haptics.selectionAsync();
    setPicked((p) => (p ?? []).includes(code) ? (p ?? []).filter((c) => c !== code) : [...(p ?? []), code]);
  };

  const save = async () => {
    if (!picked?.length) return;
    setSaving(true);
    setError(false);
    const ok = await setMyCompetitions(picked);
    setSaving(false);
    if (!ok) { setError(true); return; }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  return (
    <ScreenBg glowTop={0.14} glowSize={460}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.base, paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <BackButton />
          <Text style={styles.title}>{t.tipMyCompetitions}</Text>
        </View>
        <Text style={styles.body}>{t.tipPickBody}</Text>

        {picked === null ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 24 }} />
        ) : (
          <>
            {competitions.map((c, i) => {
              const on = picked.includes(c.code);
              return (
                <Animated.View key={c.code} entering={FadeInDown.delay(i * 50).duration(350)}>
                  <Pressable onPress={() => toggle(c.code)} style={[styles.row, on && styles.rowOn]}>
                    <Emblem uri={c.emblem} size={28} />
                    <Text style={[styles.name, on && styles.nameOn]}>{c.name}</Text>
                    <View style={[styles.check, on && styles.checkOn]}>
                      <Text style={[styles.checkText, on && styles.checkTextOn]}>{on ? '✓' : ''}</Text>
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
            {error && <Text style={styles.error}>{t.tipError}</Text>}
            <GlowButton label={t.tipSave} onPress={save} loading={saving} disabled={picked.length === 0} />
          </>
        )}
      </ScrollView>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: Spacing.lg, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { color: Colors.textPrimary, fontSize: Typography.xl, fontFamily: Fonts.extrabold },
  body: { color: Colors.textSecondary, fontSize: Typography.sm, fontFamily: Fonts.medium, marginBottom: 4 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 16,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.glassBorder,
  },
  rowOn: { borderColor: Colors.primary, backgroundColor: Colors.glowGreen },
  name: { flex: 1, color: Colors.textSecondary, fontSize: Typography.md, fontFamily: Fonts.bold },
  nameOn: { color: Colors.textPrimary },
  check: {
    width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.glassBorder,
  },
  checkOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkText: { color: Colors.background, fontSize: Typography.sm, fontFamily: Fonts.black },
  checkTextOn: { color: Colors.background },
  error: { color: Colors.danger, fontSize: Typography.sm, fontFamily: Fonts.semibold, textAlign: 'center' },
});
