import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, RefreshControl, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import BackButton from '../../src/components/BackButton';
import BETinaAvatar from '../../src/components/BETinaAvatar';
import GlowCard from '../../src/components/GlowCard';
import ScreenBg from '../../src/components/ScreenBg';
import { CompetitionChips } from '../../src/components/TipParts';
import { useI18n } from '../../src/lib/i18n';
import { Competition, RankRow, fetchCompetitions, fetchLeaderboard, fetchMyCompetitions } from '../../src/lib/tippspiel';
import { Colors, Fonts, Spacing, Typography } from '../../src/theme';

const PODIUM = [
  { place: 2, color: Colors.silver, height: 64 },
  { place: 1, color: Colors.gold, height: 88 },
  { place: 3, color: Colors.bronze, height: 48 },
];

export default function RankingScreen() {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ competition?: string; group?: string; groupName?: string; code?: string }>();
  const group = params.group ?? null;

  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [comp, setComp] = useState<string | null>(group ? null : (params.competition || null));
  const [period, setPeriod] = useState<'season' | 'matchday'>('season');
  const [rows, setRows] = useState<RankRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    Promise.all([fetchCompetitions(), fetchMyCompetitions()]).then(([all, mine]) => {
      setCompetitions(mine.length ? all.filter((c) => mine.includes(c.code)) : all);
    });
  }, []);

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
  const list = group ? rows : rows.filter((r) => r.points > 0 || r.tips > 0);
  const hasPoints = list.some((r) => r.points > 0);
  const podium = hasPoints ? list.slice(0, 3) : [];
  const rest = hasPoints ? list.slice(3) : list;

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
            <Text style={styles.title} numberOfLines={1}>{group ? params.groupName ?? t.tipGroups : t.tipRanking}</Text>
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
        ) : list.length === 0 ? (
          <GlowCard style={styles.emptyCard}>
            <Text style={styles.emptyText}>{t.tipNoRanking}</Text>
          </GlowCard>
        ) : (
          <>
            {/* Podium */}
            {podium.length > 0 && (
              <View style={styles.podium}>
                {PODIUM.map((step, i) => {
                  const r = podium[step.place - 1];
                  if (!r) return <View key={step.place} style={styles.podiumCol} />;
                  return (
                    <Animated.View key={step.place} entering={FadeInUp.delay(120 + i * 90).duration(450)} style={styles.podiumCol}>
                      <PlayerBadge row={r} size={step.place === 1 ? 54 : 44} ring={step.color} />
                      <Text style={[styles.podiumName, r.is_me && styles.nameMe]} numberOfLines={1}>{r.is_me ? t.tipYou : r.display_name}</Text>
                      <Text style={styles.podiumPts}>{r.points} {t.tipPts}</Text>
                      <View style={[styles.step, { height: step.height, borderColor: step.color }]}>
                        <Text style={[styles.stepPlace, { color: step.color }]}>{r.rank}</Text>
                      </View>
                    </Animated.View>
                  );
                })}
              </View>
            )}

            {/* Everyone else */}
            {rest.length > 0 && (
              <GlowCard style={styles.table}>
                <View style={styles.legend}>
                  <Legend color={Colors.gold} label="3" />
                  <Legend color={Colors.primary} label="2" />
                  <Legend color={Colors.accentLight} label="1" />
                  <Text style={[styles.legendText, { marginLeft: 'auto' }]}>{t.tipTipsCol} · {t.tipPts}</Text>
                </View>
                {rest.map((r, i) => (
                  <Animated.View
                    key={r.user_id}
                    entering={FadeInDown.delay(Math.min(i, 12) * 30).duration(350)}
                    style={[styles.row, r.is_me && styles.rowMe, r.is_betina && styles.rowBetina]}
                  >
                    <Text style={styles.rank}>{r.rank}</Text>
                    <Trend row={r} />
                    <PlayerBadge row={r} size={30} />
                    <View style={{ flex: 1, gap: 3 }}>
                      <Text style={[styles.name, r.is_me && styles.nameMe]} numberOfLines={1}>
                        {r.is_me ? `${r.display_name} · ${t.tipYou}` : r.display_name}
                      </Text>
                      <View style={styles.counts}>
                        <Count color={Colors.gold} n={r.exact} />
                        <Count color={Colors.primary} n={r.diffs} />
                        <Count color={Colors.accentLight} n={Math.max(0, r.hits - r.exact - r.diffs)} />
                      </View>
                    </View>
                    <Text style={styles.tipsN}>{r.tips}</Text>
                    <Text style={styles.pts}>{r.points}</Text>
                  </Animated.View>
                ))}
              </GlowCard>
            )}
          </>
        )}
      </ScrollView>
    </ScreenBg>
  );
}

/** BETina's avatar for her row, initials in a ring for players. */
function PlayerBadge({ row, size, ring }: { row: RankRow; size: number; ring?: string }) {
  if (row.is_betina) return <BETinaAvatar size={size} />;
  const initials = row.display_name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <View
      style={[
        styles.badge,
        { width: size, height: size, borderRadius: size / 2, borderColor: ring ?? (row.is_me ? Colors.primary : Colors.glassBorder) },
      ]}
    >
      <Text style={[styles.badgeText, { fontSize: size * 0.36 }]}>{initials}</Text>
    </View>
  );
}

/** ▲2 / ▼1 since the last round; nothing when unchanged or new. */
function Trend({ row }: { row: RankRow }) {
  const d = row.prev_rank == null ? 0 : row.prev_rank - row.rank;
  if (d === 0) return <Text style={[styles.trend, { color: Colors.textMuted }]}>·</Text>;
  return (
    <Text style={[styles.trend, { color: d > 0 ? Colors.success : Colors.danger }]}>
      {d > 0 ? '▲' : '▼'}{Math.abs(d)}
    </Text>
  );
}

function Count({ color, n }: { color: string; n: number }) {
  return (
    <View style={styles.count}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.countText}>{n}</Text>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.count}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
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
  podium: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingTop: 8 },
  podiumCol: { flex: 1, alignItems: 'center', gap: 4 },
  podiumName: { color: Colors.textPrimary, fontSize: Typography.sm, fontFamily: Fonts.bold, maxWidth: '100%' },
  podiumPts: { color: Colors.textSecondary, fontSize: Typography.xs + 1, fontFamily: Fonts.semibold },
  step: {
    alignSelf: 'stretch', marginTop: 6, borderTopLeftRadius: 12, borderTopRightRadius: 12,
    borderWidth: 1, borderBottomWidth: 0, backgroundColor: Colors.card,
    alignItems: 'center', justifyContent: 'center',
  },
  stepPlace: { fontSize: Typography['2xl'], fontFamily: Fonts.blackItalic },
  badge: { alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.cardElevated, borderWidth: 2 },
  badgeText: { color: Colors.textPrimary, fontFamily: Fonts.extrabold },
  table: { paddingVertical: 8, paddingHorizontal: 6, gap: 2 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 10, paddingVertical: 6 },
  legendText: { color: Colors.textMuted, fontSize: Typography.xs, fontFamily: Fonts.bold },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingVertical: 10, borderRadius: 12 },
  rowMe: { backgroundColor: Colors.glowGreen },
  rowBetina: { backgroundColor: Colors.glowPurple },
  rank: { width: 26, color: Colors.textSecondary, fontSize: Typography.base, fontFamily: Fonts.bold, textAlign: 'right' },
  trend: { width: 26, fontSize: Typography.xs, fontFamily: Fonts.extrabold, textAlign: 'center' },
  name: { color: Colors.textPrimary, fontSize: Typography.base, fontFamily: Fonts.semibold },
  nameMe: { color: Colors.primary },
  counts: { flexDirection: 'row', gap: 10 },
  count: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  countText: { color: Colors.textSecondary, fontSize: Typography.xs, fontFamily: Fonts.semibold },
  tipsN: { width: 30, color: Colors.textMuted, fontSize: Typography.sm, fontFamily: Fonts.semibold, textAlign: 'right' },
  pts: { width: 40, color: Colors.textPrimary, fontSize: Typography.md, fontFamily: Fonts.black, textAlign: 'right' },
  emptyCard: { padding: 20, alignItems: 'center' },
  emptyText: { color: Colors.textSecondary, fontSize: Typography.sm, fontFamily: Fonts.medium, textAlign: 'center' },
});
