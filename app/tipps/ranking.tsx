import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, RefreshControl, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import BackButton from '../../src/components/BackButton';
import BETinaAvatar from '../../src/components/BETinaAvatar';
import ScreenBg from '../../src/components/ScreenBg';
import { CompetitionChips, LOCALE } from '../../src/components/TipParts';
import { Headline, Meta } from '../../src/components/Urban';
import { useI18n } from '../../src/lib/i18n';
import {
  Competition, GroupDuel, RankRow, fetchCompetitions, fetchGroupDuel, fetchLeaderboard, fetchMyCompetitions,
} from '../../src/lib/tippspiel';
import { Colors, Fonts } from '../../src/theme';

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
  const [duel, setDuel] = useState<GroupDuel | null>(null);
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
    const [data, teamDuel] = await Promise.all([
      fetchLeaderboard({
        competition: comp,
        matchday: period === 'matchday' && canMatchday ? matchday : null,
        group,
      }),
      group ? fetchGroupDuel(group) : Promise.resolve(null),
    ]);
    setRows(data);
    setDuel(teamDuel);
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
    <ScreenBg>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        <View style={styles.header}>
          <BackButton />
          <View style={{ flex: 1 }}>
            <Headline text={group ? params.groupName ?? t.tipGroups : t.tipRanking} size={34} accent="last" numberOfLines={1} />
            {group && params.code ? <Meta color={Colors.primary}>{`${t.tipCodePlaceholder}: ${params.code}`}</Meta> : null}
          </View>
        </View>

        {group && params.code ? (
          <Pressable onPress={invite} style={({ pressed }) => [styles.invite, pressed && styles.invitePressed]}>
            <Text style={styles.inviteText}>{t.tipInvite.toUpperCase()}</Text>
            <Text style={styles.inviteText}>→</Text>
          </Pressable>
        ) : null}

        {group && <TeamCard duel={duel} />}

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
                  {(p === 'season' ? t.tipSeason : `${t.tipMatchday}${matchday != null ? ` ${matchday}` : ''}`).toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 24 }} />
        ) : list.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>{t.tipNoRanking}</Text>
          </View>
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
                      <Text style={[styles.podiumName, r.is_me && styles.nameMe]} numberOfLines={1}>{(r.is_me ? t.tipYou : r.display_name).toUpperCase()}</Text>
                      <Meta>{`${r.points} ${t.tipPts}`}</Meta>
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
              <View style={styles.table}>
                <View style={styles.legend}>
                  <Legend color={Colors.primary} label="3" />
                  <Legend color={Colors.white} label="2" />
                  <Legend color={Colors.textMuted} label="1" />
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
                        <Count color={Colors.primary} n={r.exact} />
                        <Count color={Colors.white} n={r.diffs} />
                        <Count color={Colors.textMuted} n={Math.max(0, r.hits - r.exact - r.diffs)} />
                      </View>
                    </View>
                    <Text style={styles.tipsN}>{r.tips}</Text>
                    <Text style={styles.pts}>{r.points}</Text>
                  </Animated.View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </ScreenBg>
  );
}

const SHORT: Record<string, string> = { BL1: 'BL', PL: 'PL', PD: 'LL', SA: 'SA', CL: 'CL' };

/** The Tipprunde as a team against BETina: rounds won : lost, latest rounds. */
function TeamCard({ duel }: { duel: GroupDuel | null }) {
  const { t, lang } = useI18n();
  const num = new Intl.NumberFormat(LOCALE[lang], { maximumFractionDigits: 1 });
  const decided = duel ? duel.won + duel.lost + duel.drawn : 0;
  return (
    <Animated.View entering={FadeInDown.duration(400)}>
      <View style={styles.team}>
        <Text style={styles.teamTitle}>{t.tipTeamTitle.toUpperCase()}</Text>
        {decided === 0 ? (
          <Text style={styles.teamSub}>{t.tipTeamEmpty}</Text>
        ) : (
          <>
            <View style={styles.teamScore}>
              <View style={styles.teamSide}>
                <Text style={[styles.teamNum, { color: Colors.primary }]}>{duel!.won}</Text>
                <Text style={styles.teamWho}>{t.tipTeamWord}</Text>
              </View>
              <Text style={styles.teamColon}>:</Text>
              <View style={styles.teamSide}>
                <Text style={[styles.teamNum, { color: Colors.white }]}>{duel!.lost}</Text>
                <View style={styles.teamBetina}>
                  <BETinaAvatar size={16} />
                  <Text style={styles.teamWho}>BETina</Text>
                </View>
              </View>
            </View>
            <Text style={styles.teamSub}>
              {decided} {t.tipTeamRounds}{duel!.drawn > 0 ? ` · ${duel!.drawn}× =` : ''} · {t.tipTeamSub}
            </Text>
            <View style={styles.teamRounds}>
              {duel!.rounds.slice(0, 5).map((r) => (
                <View
                  key={`${r.competition}-${r.matchday}`}
                  style={[styles.roundChip, r.result === 'W' ? styles.roundWin : r.result === 'L' ? styles.roundLoss : null]}
                >
                  <Text style={styles.roundChipLabel}>{SHORT[r.competition] ?? r.competition} {r.matchday}</Text>
                  <Text style={styles.roundChipScore}>{num.format(r.team)} : {r.betina}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </View>
    </Animated.View>
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
        { width: size, height: size, borderColor: ring ?? (row.is_me ? Colors.primary : Colors.border) },
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
  content: { paddingHorizontal: 16, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  invite: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 16, backgroundColor: Colors.primary,
  },
  invitePressed: { backgroundColor: Colors.primaryDim },
  inviteText: { color: Colors.black, fontSize: 20, fontFamily: Fonts.display, letterSpacing: 0.4 },
  segment: { flexDirection: 'row', borderWidth: 1.5, borderColor: Colors.borderStrong },
  segmentBtn: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  segmentBtnActive: { backgroundColor: Colors.primary },
  segmentBtnOff: { opacity: 0.4 },
  segmentText: { color: Colors.textSecondary, fontSize: 15, fontFamily: Fonts.label, letterSpacing: 0.5 },
  segmentTextActive: { color: Colors.black },
  podium: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingTop: 8 },
  podiumCol: { flex: 1, alignItems: 'center', gap: 4 },
  podiumName: { color: Colors.white, fontSize: 15, fontFamily: Fonts.label, maxWidth: '100%' },
  step: {
    alignSelf: 'stretch', marginTop: 6, borderWidth: 1.5, borderBottomWidth: 0, backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  stepPlace: { fontSize: 40, fontFamily: Fonts.display },
  badge: { alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.card, borderWidth: 2 },
  badgeText: { color: Colors.white, fontFamily: Fonts.label },
  table: { borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface },
  legend: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: Colors.line,
  },
  legendText: { color: Colors.textMuted, fontSize: 10, fontFamily: Fonts.mono, letterSpacing: 0.8 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 11,
    borderBottomWidth: 1, borderBottomColor: Colors.line,
  },
  rowMe: { backgroundColor: Colors.glowGreen, borderLeftWidth: 3, borderLeftColor: Colors.primary },
  rowBetina: { backgroundColor: Colors.card },
  rank: { width: 28, color: Colors.white, fontSize: 20, fontFamily: Fonts.display, textAlign: 'right' },
  trend: { width: 28, fontSize: 10, fontFamily: Fonts.monoBold, textAlign: 'center' },
  name: { color: Colors.white, fontSize: 16, fontFamily: Fonts.label },
  nameMe: { color: Colors.primary },
  counts: { flexDirection: 'row', gap: 10 },
  count: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 7, height: 7 },
  countText: { color: Colors.textSecondary, fontSize: 10, fontFamily: Fonts.mono },
  tipsN: { width: 30, color: Colors.textMuted, fontSize: 12, fontFamily: Fonts.mono, textAlign: 'right' },
  pts: { width: 44, color: Colors.white, fontSize: 24, fontFamily: Fonts.display, textAlign: 'right' },
  team: { padding: 16, gap: 10, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.primary, backgroundColor: Colors.surface },
  teamTitle: { color: Colors.primary, fontSize: 20, fontFamily: Fonts.display, letterSpacing: 0.5 },
  teamScore: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  teamSide: { alignItems: 'center', gap: 2, minWidth: 80 },
  teamNum: { fontSize: 56, lineHeight: 58, fontFamily: Fonts.display },
  teamColon: { color: Colors.textMuted, fontSize: 40, fontFamily: Fonts.display },
  teamWho: { color: Colors.white, fontSize: 13, fontFamily: Fonts.label, letterSpacing: 1 },
  teamBetina: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  teamSub: { color: Colors.textSecondary, fontSize: 13, fontFamily: Fonts.medium, textAlign: 'center' },
  teamRounds: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 },
  roundChip: { alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1.5, borderColor: Colors.borderStrong },
  roundWin: { borderColor: Colors.primary, backgroundColor: Colors.glowGreen },
  roundLoss: { borderColor: Colors.danger },
  roundChipLabel: { color: Colors.textMuted, fontSize: 9, fontFamily: Fonts.mono, letterSpacing: 0.6 },
  roundChipScore: { color: Colors.white, fontSize: 15, fontFamily: Fonts.display },
  emptyCard: { padding: 20, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface },
  emptyText: { color: Colors.textSecondary, fontSize: 15, fontFamily: Fonts.medium, textAlign: 'center', lineHeight: 21 },
});
