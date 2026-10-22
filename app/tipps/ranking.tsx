import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, RefreshControl, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import BackButton from '../../src/components/BackButton';
import GlowCard from '../../src/components/GlowCard';
import ScreenBg from '../../src/components/ScreenBg';
import { CompetitionChips } from '../../src/components/TipParts';
import { useI18n } from '../../src/lib/i18n';
import { Competition, RankRow, fetchCompetitions, fetchLeaderboard } from '../../src/lib/tippspiel';
import { Colors, Fonts, Spacing, Typography } from '../../src/theme';

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function RankingScreen() {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ competition?: string; group?: string; groupName?: string; code?: string }>();
  const group = params.group ?? null;

  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [comp, setComp] = useState<string | null>(group ? null : (params.competition ?? null));
  const [period, setPeriod] = useState<'season' | 'matchday'>('season');
  const [rows, setRows] = useState<RankRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchCompetitions().then(setCompetitions); }, []);

  const matchday = comp ? competitions.find((c) => c.code === comp)?.current_matchday ?? null : null;
  const canMatchday = comp != null && matchday != null;

  const load = useCallback(async () => {
    const data = await fetchLeaderboard({
      competition: comp,
      matchday: period === 'matchday' && canMatchday ? matchday : null,
      group,
    });
    setRows(data);
    setLoading(false);
  }, [comp, period, canMatchday, matchday, group]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const invite = () => {
    if (!params.code) return;
    const message = t.tipShareText.replace('{group}', params.groupName ?? '').replace('{code}', params.code);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (Platform.OS === 'web') {
      // navigator.share needs a user gesture + HTTPS; the clipboard is the fallback.
      const nav = globalThis.navigator as Navigator | undefined;
      if (nav?.share) nav.share({ text: message }).catch(() => {});
      else nav?.clipboard?.writeText(message).catch(() => {});
      return;
    }
    Share.share({ message });
  };

  // Everyone: only players who have tipped. A Tipprunde lists all members.
  const top = group ? rows : rows.filter((r) => r.points > 0 || r.tips > 0);
  const meOutsideTop = rows.length > 0 && rows[rows.length - 1].is_me && rows.length > 1 && rows[rows.length - 1].rank > rows.length;

  return (
    <ScreenBg glowTop={0.14} glowSize={460}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.base, paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        <View style={styles.header}>
          <BackButton />
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{group ? params.groupName ?? t.tipGroups : t.tipRanking}</Text>
            {group && params.code ? <Text style={styles.subtitle}>{t.tipCodePlaceholder}: {params.code}</Text> : null}
          </View>
        </View>

        {group && params.code ? (
          <Pressable onPress={invite} style={({ pressed }) => [styles.invite, pressed && styles.invitePressed]}>
            <Text style={styles.inviteText}>📨 {t.tipInvite}</Text>
          </Pressable>
        ) : null}

        <CompetitionChips competitions={competitions} value={comp} onChange={setComp} allLabel={t.tipAllComps} />

        <View style={styles.segment}>
          {(['season', 'matchday'] as const).map((p) => {
            const active = period === p || (p === 'season' && !canMatchday);
            const disabled = p === 'matchday' && !canMatchday;
            return (
              <Pressable
                key={p}
                disabled={disabled}
                onPress={() => { Haptics.selectionAsync(); setPeriod(p); }}
                style={[styles.segmentBtn, active && styles.segmentBtnActive, disabled && styles.segmentBtnOff]}
              >
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                  {p === 'season' ? t.tipSeason : `${t.tipMatchday}${matchday != null ? ` ${matchday}` : ''}`}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 24 }} />
        ) : top.length === 0 ? (
          <GlowCard style={styles.emptyCard}>
            <Text style={styles.emptyText}>{t.tipNoRanking}</Text>
          </GlowCard>
        ) : (
          <GlowCard style={styles.table}>
            <View style={styles.rowHead}>
              <Text style={[styles.headText, styles.colRank]}>#</Text>
              <Text style={[styles.headText, styles.colName]}>{group ? t.tipGroups : t.tipEveryone}</Text>
              <Text style={[styles.headText, styles.colNum]}>🎯</Text>
              <Text style={[styles.headText, styles.colPts]}>{t.tipPts}</Text>
            </View>
            {top.map((r, i) => (
              <Animated.View
                key={r.user_id}
                entering={FadeInDown.delay(Math.min(i, 12) * 30).duration(350)}
                style={[
                  styles.row,
                  r.is_me && styles.rowMe,
                  meOutsideTop && i === top.length - 1 && styles.rowDetached,
                ]}
              >
                <Text style={[styles.rank, styles.colRank]}>{MEDAL[r.rank] ?? r.rank}</Text>
                <Text style={[styles.name, styles.colName, r.is_me && styles.nameMe]} numberOfLines={1}>
                  {r.is_me ? `${r.display_name} · ${t.tipYou}` : r.display_name}
                </Text>
                <Text style={[styles.num, styles.colNum]}>{r.exact}</Text>
                <Text style={[styles.pts, styles.colPts]}>{r.points}</Text>
              </Animated.View>
            ))}
          </GlowCard>
        )}
      </ScrollView>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: Spacing.lg, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { color: Colors.textPrimary, fontSize: Typography.xl, fontFamily: Fonts.extrabold },
  subtitle: { color: Colors.textSecondary, fontSize: Typography.sm, fontFamily: Fonts.semibold, letterSpacing: 1 },
  invite: {
    alignItems: 'center', paddingVertical: 12, borderRadius: 14,
    backgroundColor: Colors.glowGreen, borderWidth: 1, borderColor: Colors.primary,
  },
  invitePressed: { backgroundColor: Colors.primaryDim },
  inviteText: { color: Colors.textPrimary, fontSize: Typography.base, fontFamily: Fonts.bold },
  segment: {
    flexDirection: 'row', padding: 4, borderRadius: 14,
    backgroundColor: Colors.glass, borderWidth: 1, borderColor: Colors.glassBorder,
  },
  segmentBtn: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center' },
  segmentBtnActive: { backgroundColor: Colors.glowGreen },
  segmentBtnOff: { opacity: 0.4 },
  segmentText: { color: Colors.textSecondary, fontSize: Typography.sm, fontFamily: Fonts.semibold },
  segmentTextActive: { color: Colors.textPrimary },
  table: { paddingVertical: 6, paddingHorizontal: 4 },
  rowHead: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8 },
  headText: { color: Colors.textMuted, fontSize: Typography.xs, fontFamily: Fonts.bold, textTransform: 'uppercase', letterSpacing: 0.8 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 11, borderRadius: 12 },
  rowMe: { backgroundColor: Colors.glowGreen },
  rowDetached: { marginTop: 10, borderTopWidth: 1, borderTopColor: Colors.glassBorder },
  colRank: { width: 36 },
  colName: { flex: 1 },
  colNum: { width: 36, textAlign: 'center' },
  colPts: { width: 48, textAlign: 'right' },
  rank: { color: Colors.textSecondary, fontSize: Typography.base, fontFamily: Fonts.bold },
  name: { color: Colors.textPrimary, fontSize: Typography.base, fontFamily: Fonts.semibold },
  nameMe: { color: Colors.primary },
  num: { color: Colors.textSecondary, fontSize: Typography.sm, fontFamily: Fonts.semibold },
  pts: { color: Colors.textPrimary, fontSize: Typography.md, fontFamily: Fonts.black },
  emptyCard: { padding: 20, alignItems: 'center' },
  emptyText: { color: Colors.textSecondary, fontSize: Typography.sm, fontFamily: Fonts.medium, textAlign: 'center' },
});
