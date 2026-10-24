import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import AnimatedNumber from '../../src/components/AnimatedNumber';
import BackButton from '../../src/components/BackButton';
import BETinaAvatar from '../../src/components/BETinaAvatar';
import GlowCard from '../../src/components/GlowCard';
import ScreenBg from '../../src/components/ScreenBg';
import { Headline } from '../../src/components/Urban';
import { CompetitionChips, fillText as fill } from '../../src/components/TipParts';
import { useI18n } from '../../src/lib/i18n';
import { Competition, Stats, fetchCompetitions, fetchMyCompetitions, fetchStats } from '../../src/lib/tippspiel';
import { Colors, Fonts, Spacing, Typography } from '../../src/theme';

// Short tags for the chart when all competitions are shown.
const SHORT: Record<string, string> = { BL1: 'BL', PL: 'PL', PD: 'LL', SA: 'SA', CL: 'CL' };
const CHART_H = 120;

export default function StatsScreen() {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [comp, setComp] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null | undefined>(undefined);

  useEffect(() => {
    Promise.all([fetchCompetitions(), fetchMyCompetitions()]).then(([all, mine]) => {
      setCompetitions(mine.length ? all.filter((c) => mine.includes(c.code)) : all);
    });
  }, []);

  const load = useCallback(async () => {
    setStats(undefined);
    setStats(await fetchStats(comp));
  }, [comp]);

  useEffect(() => { load(); }, [load]);

  const s = stats;
  const hits = s ? s.exact + s.diffs + s.tendency : 0;
  const rate = s && s.scored > 0 ? Math.round((hits / s.scored) * 100) : 0;
  const maxPts = Math.max(1, ...(s?.series ?? []).map((r) => r.points));
  const parts = s ? [
    { n: s.exact, color: Colors.primary, label: t.tipExactShort },
    { n: s.diffs, color: Colors.primary, label: t.tipDiffShort },
    { n: s.tendency, color: Colors.white, label: t.tipTendencyShort },
    { n: s.misses, color: Colors.textMuted, label: t.tipMissShort },
  ] : [];

  return (
    <ScreenBg>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <BackButton />
          <Headline text={t.tipStats} size={34} accent="last" />
        </View>

        <CompetitionChips competitions={competitions} value={comp} onChange={setComp} allLabel={t.tipAllComps} />

        {s === undefined ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 24 }} />
        ) : !s || s.scored === 0 ? (
          <GlowCard style={styles.emptyCard}>
            <BETinaAvatar size={56} />
            <Text style={styles.emptyText}>{t.tipNoStats}</Text>
          </GlowCard>
        ) : (
          <>
            {/* Duel */}
            <Animated.View entering={FadeInDown.duration(400)}>
              <GlowCard style={styles.duelCard}>
                <Text style={styles.cardTitle}>{t.tipDuelTitle}</Text>
                <View style={styles.duelRow}>
                  <View style={styles.duelSide}>
                    <AnimatedNumber value={s.duel?.me ?? 0} style={[styles.duelPts, { color: Colors.primary }]} />
                    <Text style={styles.duelWho}>{t.tipYouShort}</Text>
                  </View>
                  <Text style={styles.duelColon}>:</Text>
                  <View style={styles.duelSide}>
                    <AnimatedNumber value={s.duel?.betina ?? 0} style={[styles.duelPts, { color: Colors.white }]} />
                    <View style={styles.duelName}>
                      <BETinaAvatar size={18} />
                      <Text style={styles.duelWho}>BETina</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.cardSub}>
                  {s.duel?.matches ? fill(t.tipDuelSub, { n: s.duel.matches }) : t.tipDuelEmpty}
                </Text>
              </GlowCard>
            </Animated.View>

            {/* Key numbers */}
            <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.tiles}>
              <GlowCard style={styles.tile}>
                <AnimatedNumber value={s.points} style={styles.tileValue} />
                <Text style={styles.tileLabel}>{t.tipSeasonPoints}</Text>
              </GlowCard>
              <GlowCard style={styles.tile}>
                <AnimatedNumber value={rate} suffix="%" style={styles.tileValue} />
                <Text style={styles.tileLabel}>{t.tipHitRate}</Text>
              </GlowCard>
              <GlowCard style={styles.tile}>
                <Text style={styles.tileValue}>{s.streak}</Text>
                <Text style={styles.tileLabel}>{t.tipStreak}</Text>
              </GlowCard>
            </Animated.View>
            {s.streak > 0 && <Text style={styles.streakSub}>{s.streak} {t.tipStreakSub}</Text>}

            {/* Breakdown */}
            <Animated.View entering={FadeInDown.delay(140).duration(400)}>
              <GlowCard style={styles.card}>
                <Text style={styles.cardTitle}>{t.tipBreakdown}</Text>
                <View style={styles.stack}>
                  {parts.filter((p) => p.n > 0).map((p) => (
                    <View key={p.label} style={{ flex: p.n, backgroundColor: p.color }} />
                  ))}
                </View>
                <View style={styles.legend}>
                  {parts.map((p) => (
                    <View key={p.label} style={styles.legendItem}>
                      <View style={[styles.dot, { backgroundColor: p.color }]} />
                      <Text style={styles.legendText}>{p.label} {p.n}</Text>
                    </View>
                  ))}
                </View>
              </GlowCard>
            </Animated.View>

            {/* Points per round */}
            {s.series.length > 0 && (
              <Animated.View entering={FadeInDown.delay(200).duration(400)}>
                <GlowCard style={styles.card}>
                  <Text style={styles.cardTitle}>{t.tipPointsPerRound}</Text>
                  <View style={styles.chart}>
                    {s.series.map((r, i) => (
                      <View key={`${r.competition}-${r.matchday}`} style={styles.barCol}>
                        <Text style={styles.barValue}>{r.points}</Text>
                        <Animated.View
                          entering={FadeInUp.delay(250 + i * 40).duration(400)}
                          style={[
                            styles.bar,
                            { height: Math.max(4, (r.points / maxPts) * CHART_H) },
                            r.points === maxPts && styles.barBest,
                          ]}
                        />
                        <Text style={styles.barLabel} numberOfLines={1}>
                          {comp ? r.matchday : `${SHORT[r.competition] ?? r.competition}${r.matchday}`}
                        </Text>
                      </View>
                    ))}
                  </View>
                  {s.best_round && (
                    <Text style={styles.cardSub}>
                      {t.tipBestRound}: {SHORT[s.best_round.competition] ?? s.best_round.competition} · {t.tipMatchday} {s.best_round.matchday} · {s.best_round.points} {t.tipPts}
                    </Text>
                  )}
                </GlowCard>
              </Animated.View>
            )}
          </>
        )}
      </ScrollView>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: Spacing.lg, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  emptyCard: { padding: 24, alignItems: 'center', gap: 12 },
  emptyText: { color: Colors.textSecondary, fontSize: Typography.sm, fontFamily: Fonts.medium, textAlign: 'center' },
  card: { padding: 16, gap: 12 },
  cardTitle: { color: Colors.white, fontSize: 24, fontFamily: Fonts.display, textTransform: 'uppercase' },
  cardSub: { color: Colors.textSecondary, fontSize: Typography.xs + 1, fontFamily: Fonts.medium, textAlign: 'center' },
  duelCard: { padding: 16, gap: 8, alignItems: 'center' },
  duelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18 },
  duelSide: { alignItems: 'center', gap: 4, minWidth: 90 },
  duelPts: { fontSize: 56, lineHeight: 58, fontFamily: Fonts.display },
  duelColon: { color: Colors.textMuted, fontSize: Typography['2xl'], fontFamily: Fonts.display },
  duelWho: { color: Colors.white, fontSize: 13, fontFamily: Fonts.label, textTransform: 'uppercase', letterSpacing: 0.4 },
  duelName: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tiles: { flexDirection: 'row', gap: 8 },
  tile: { flex: 1, alignItems: 'center', paddingVertical: 12, gap: 2 },
  tileValue: { color: Colors.white, fontSize: 34, lineHeight: 38, fontFamily: Fonts.display },
  tileLabel: { color: Colors.textMuted, fontSize: 10, fontFamily: Fonts.mono, letterSpacing: 0.8, textTransform: 'uppercase', textAlign: 'center' },
  streakSub: { color: Colors.textSecondary, fontSize: Typography.xs + 1, fontFamily: Fonts.medium, textAlign: 'center', marginTop: -6 },
  stack: { flexDirection: 'row', height: 14, borderRadius: 0, overflow: 'hidden', backgroundColor: Colors.glass },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 0 },
  legendText: { color: Colors.textSecondary, fontSize: 11, fontFamily: Fonts.mono, letterSpacing: 0.6, textTransform: 'uppercase' },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: CHART_H + 40 },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  bar: { width: '70%', backgroundColor: Colors.borderStrong },
  barBest: { backgroundColor: Colors.primary },
  barValue: { color: Colors.white, fontSize: 14, fontFamily: Fonts.display },
  barLabel: { color: Colors.textMuted, fontSize: 9, fontFamily: Fonts.mono },
});
