import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import BackButton from '../../src/components/BackButton';
import BETinaAvatar from '../../src/components/BETinaAvatar';
import GlowCard from '../../src/components/GlowCard';
import ScreenBg from '../../src/components/ScreenBg';
import SignInWall from '../../src/components/SignInWall';
import { CompetitionChips, Crest, LOCALE, PointsBadge, fillText as fill, roundLabel } from '../../src/components/TipParts';
import { useProfile } from '../../src/hooks/useProfile';
import { useSession } from '../../src/hooks/useSession';
import { useI18n } from '../../src/lib/i18n';
import {
  Competition, Round, Tip, TipMatch,
  currentRoundIndex, defaultCompetition, fetchBetinaTipped, fetchBetinaTips, fetchCompetitions, fetchMatches, fetchMyCompetitions, fetchMyTips,
  isFinished, isLive, isOpen, isVoid, placeTip, toRounds,
} from '../../src/lib/tippspiel';
import { Colors, Fonts, Spacing, Typography } from '../../src/theme';

type Draft = { home: number; away: number };
type SaveState = 'saving' | 'saved' | 'error' | 'closed';


export default function PlayScreen() {
  const session = useSession();
  const { t } = useI18n();
  if (session === undefined) return <ScreenBg glowTop={0.14} glowSize={460} />;
  if (session === null) return <SignInWall body={t.tipGuestBody} />;
  return <Play />;
}

// Remember the picked competition across visits (per app session).
let lastCompetition: string | null = null;

function Play() {
  const { t, lang } = useI18n();
  const params = useLocalSearchParams<{ competition?: string }>();
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();
  const firstName = (profile?.name ?? '').trim().split(/\s+/)[0] || '';

  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [comp, setComp] = useState<string>(params.competition ?? lastCompetition ?? defaultCompetition(lang));
  const [rounds, setRounds] = useState<Round[]>([]);
  const [roundIdx, setRoundIdx] = useState(0);
  const [tips, setTips] = useState<Record<number, Tip>>({});
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});
  const [saveState, setSaveState] = useState<Record<number, SaveState>>({});
  const [betina, setBetina] = useState<Record<number, Tip>>({});
  const [betinaTipped, setBetinaTipped] = useState<Set<number>>(new Set());
  const [mine, setMine] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const timers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const competition = competitions.find((c) => c.code === comp) ?? null;

  const load = useCallback(async (keepRound = false) => {
    const comps = competitions.length ? competitions : await fetchCompetitions();
    if (!competitions.length) setCompetitions(comps);
    const c = comps.find((x) => x.code === comp);
    if (!c?.current_season) {
      setRounds([]);
      setLoading(false);
      return;
    }
    const matches = await fetchMatches(c.code, c.current_season);
    const rs = toRounds(matches);
    // BETina's tips are readable from kickoff; before that we only learn that she has tipped.
    const started = matches.filter((m) => Date.parse(m.kickoff) <= Date.now()).map((m) => m.id);
    const upcoming = matches.filter((m) => Date.parse(m.kickoff) > Date.now()).map((m) => m.id);
    const [myTips, betinaTips, tippedByBetina, myComps] = await Promise.all([
      fetchMyTips(matches.map((m) => m.id)),
      fetchBetinaTips(started.slice(-60)),
      fetchBetinaTipped(upcoming),
      fetchMyCompetitions(),
    ]);
    setRounds(rs);
    if (!keepRound) setRoundIdx(currentRoundIndex(rs));
    setTips(myTips);
    setBetina(betinaTips);
    setBetinaTipped(tippedByBetina);
    setMine(myComps);
    setLoading(false);
  }, [comp, competitions]);

  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    setLoading(true);
    setDrafts({});
    setSaveState({});
    loadRef.current();
  }, [comp]);

  // Results and points move while the player is away: refresh when the tab
  // regains focus (the first focus is the initial load above).
  const focused = useRef(false);
  useFocusEffect(useCallback(() => {
    if (focused.current) loadRef.current(true);
    focused.current = true;
  }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  };

  const pickCompetition = (code: string | null) => {
    if (!code || code === comp) return;
    lastCompetition = code;
    setComp(code);
  };

  // ── Tipping ────────────────────────────────────────────────────────────────
  const scoreOf = (m: TipMatch): Draft | null => drafts[m.id] ?? (tips[m.id] ? { home: tips[m.id].home, away: tips[m.id].away } : null);

  const change = (m: TipMatch, side: 'home' | 'away', delta: number) => {
    if (!isOpen(m)) return;
    // An untipped match starts from 0:0, so the first "+" makes it 1:0 / 0:1.
    const cur = scoreOf(m) ?? { home: 0, away: 0 };
    const next = { ...cur, [side]: Math.min(20, Math.max(0, cur[side] + delta)) };
    Haptics.selectionAsync();
    setDrafts((d) => ({ ...d, [m.id]: next }));
    setSaveState((s) => ({ ...s, [m.id]: 'saving' }));
    clearTimeout(timers.current[m.id]);
    timers.current[m.id] = setTimeout(() => save(m.id, next), 700);
  };

  const save = async (matchId: number, score: Draft) => {
    const res = await placeTip(matchId, score.home, score.away);
    if (res.ok) {
      setTips((tp) => ({ ...tp, [matchId]: { match_id: matchId, home: score.home, away: score.away, points: null } }));
      setSaveState((s) => ({ ...s, [matchId]: 'saved' }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      setSaveState((s) => ({ ...s, [matchId]: res.error === 'tip_closed' ? 'closed' : 'error' }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  useEffect(() => () => Object.values(timers.current).forEach(clearTimeout), []);

  // ── BETina's line for this round ───────────────────────────────────────────
  const round = rounds[roundIdx];
  const hostLine = useMemo(() => {
    if (!round) return fill(t.tipWarmingUp, { name: firstName });
    const open = round.matches.filter((m) => isOpen(m) && !tips[m.id]).length;
    if (open > 0) return fill(t.tipHostOpen, { name: firstName, n: open });
    if (round.matches.some(isLive)) return fill(t.tipHostLive, { name: firstName });
    if (round.matches.every((m) => isFinished(m) || isVoid(m))) {
      const p = round.matches.reduce((sum, m) => sum + (tips[m.id]?.points ?? 0), 0);
      return fill(t.tipHostOver, { name: firstName, p });
    }
    return fill(t.tipHostDone, { name: firstName });
  }, [round, tips, firstName, t]);

  // Matches of the round grouped by local calendar day.
  const days = useMemo(() => {
    const out: { label: string; matches: TipMatch[] }[] = [];
    const fmt = new Intl.DateTimeFormat(LOCALE[lang], { weekday: 'short', day: 'numeric', month: 'short' });
    const today = fmt.format(new Date());
    for (const m of round?.matches ?? []) {
      const d = fmt.format(new Date(m.kickoff));
      const label = d === today ? t.tipToday : d;
      const last = out[out.length - 1];
      if (last?.label === label) last.matches.push(m);
      else out.push({ label, matches: [m] });
    }
    return out;
  }, [round, lang, t]);

  const timeFmt = useMemo(() => new Intl.DateTimeFormat(LOCALE[lang], { hour: '2-digit', minute: '2-digit' }), [lang]);

  return (
    <ScreenBg glowTop={0.14} glowSize={460}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.base, paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        <View style={styles.header}>
          <BackButton />
          <Text style={styles.title} numberOfLines={1}>{competition?.name ?? t.tipTitle}</Text>
        </View>

        {/* BETina hosts */}
        <Animated.View entering={FadeInDown.delay(60).duration(500)} style={styles.host}>
          <BETinaAvatar size={46} online />
          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>{hostLine}</Text>
          </View>
        </Animated.View>

        <CompetitionChips
          competitions={mine.length ? competitions.filter((c) => mine.includes(c.code)) : competitions}
          value={comp}
          onChange={pickCompetition}
        />

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 24 }} />
        ) : !round ? (
          <GlowCard style={styles.emptyCard}>
            <Text style={styles.emptyText}>{competition?.current_season ? t.tipEmpty : fill(t.tipWarmingUp, { name: firstName })}</Text>
          </GlowCard>
        ) : (
          <>
            {/* Round navigation */}
            <View style={styles.roundNav}>
              <Pressable
                onPress={() => { Haptics.selectionAsync(); setRoundIdx((i) => Math.max(0, i - 1)); }}
                disabled={roundIdx === 0}
                style={[styles.roundArrow, roundIdx === 0 && styles.roundArrowOff]}
                hitSlop={8}
              >
                <Text style={styles.roundArrowText}>‹</Text>
              </Pressable>
              <Text style={styles.roundTitle}>{roundLabel(round, t)}</Text>
              <Pressable
                onPress={() => { Haptics.selectionAsync(); setRoundIdx((i) => Math.min(rounds.length - 1, i + 1)); }}
                disabled={roundIdx >= rounds.length - 1}
                style={[styles.roundArrow, roundIdx >= rounds.length - 1 && styles.roundArrowOff]}
                hitSlop={8}
              >
                <Text style={styles.roundArrowText}>›</Text>
              </Pressable>
            </View>

            {days.map((day) => (
              <View key={day.label} style={styles.day}>
                <Text style={styles.dayLabel}>{day.label}</Text>
                {day.matches.map((m) => (
                  <MatchCard
                    key={m.id}
                    match={m}
                    score={scoreOf(m)}
                    tip={tips[m.id] ?? null}
                    betina={betina[m.id] ?? null}
                    betinaHasTipped={betinaTipped.has(m.id)}
                    state={saveState[m.id]}
                    time={timeFmt.format(new Date(m.kickoff))}
                    onChange={change}
                    t={t}
                  />
                ))}
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </ScreenBg>
  );
}

type MatchCardProps = {
  match: TipMatch;
  score: Draft | null;
  tip: Tip | null;
  betina: Tip | null;
  betinaHasTipped: boolean;
  state?: SaveState;
  time: string;
  onChange: (m: TipMatch, side: 'home' | 'away', delta: number) => void;
  t: ReturnType<typeof useI18n>['t'];
};

function MatchCard({ match: m, score, tip, betina, betinaHasTipped, state, time, onChange, t }: MatchCardProps) {
  const open = isOpen(m);
  const live = isLive(m);
  const finished = isFinished(m);
  const voided = isVoid(m);

  let status: React.ReactNode;
  if (open) {
    status = state === 'saving' ? <Text style={styles.metaMuted}>…</Text>
      : state === 'saved' ? <Text style={styles.metaSaved}>✓ {t.tipSaved}</Text>
      : state === 'closed' ? <Text style={styles.metaError}>{t.tipClosed}</Text>
      : state === 'error' ? <Text style={styles.metaError}>{t.tipError}</Text>
      : null;
  } else if (live) {
    status = <View style={styles.livePill}><Text style={styles.livePillText}>{t.tipLive}</Text></View>;
  } else if (voided) {
    status = <Text style={styles.metaMuted}>{t.tipVoid}</Text>;
  } else if (finished && tip?.points != null) {
    status = <PointsBadge points={tip.points} />;
  } else if (finished) {
    status = <Text style={styles.metaMuted}>{t.tipNoTip}</Text>;
  }

  const showResult = (live || finished) && m.home_score != null && m.away_score != null;

  return (
    <GlowCard style={[styles.card, open && score && styles.cardTipped]}>
      <View style={styles.cardHead}>
        <Text style={styles.metaTime}>{time}</Text>
        {status}
      </View>
      {(['home', 'away'] as const).map((side) => {
        const name = side === 'home' ? (m.home_short ?? m.home_name) : (m.away_short ?? m.away_name);
        const crest = side === 'home' ? m.home_crest : m.away_crest;
        const result = side === 'home' ? m.home_score : m.away_score;
        return (
          <View key={side} style={styles.teamRow}>
            <Crest uri={crest} name={name} />
            <Text style={styles.teamName} numberOfLines={1}>{name}</Text>
            {open ? (
              <View style={styles.stepper}>
                <StepButton label="−" onPress={() => onChange(m, side, -1)} disabled={!score || score[side] === 0} />
                <Animated.Text key={score ? score[side] : 'none'} entering={FadeIn.duration(150)} style={[styles.stepValue, !score && styles.stepValueEmpty]}>
                  {score ? score[side] : '–'}
                </Animated.Text>
                <StepButton label="+" onPress={() => onChange(m, side, 1)} />
              </View>
            ) : (
              <Text style={styles.resultValue}>{showResult ? result : '–'}</Text>
            )}
          </View>
        );
      })}
      {open && betinaHasTipped && (
        <View style={styles.betinaLocked}>
          <BETinaAvatar size={16} />
          <Text style={styles.betinaLockedText}>🔒 {t.tipBetinaLocked}</Text>
        </View>
      )}
      {!open && (tip || betina) && (
        <View style={styles.tipsRow}>
          {tip && <Text style={styles.yourTip}>{t.tipYourTip}: {tip.home}:{tip.away}</Text>}
          {betina && (
            <View style={styles.betinaTip}>
              <BETinaAvatar size={18} />
              <Text style={styles.betinaTipText}>{betina.home}:{betina.away}</Text>
              {betina.points != null && <PointsBadge points={betina.points} />}
            </View>
          )}
        </View>
      )}
    </GlowCard>
  );
}

function StepButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      style={({ pressed }) => [styles.stepBtn, pressed && styles.stepBtnPressed, disabled && styles.stepBtnOff]}
    >
      <Text style={styles.stepBtnText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: Spacing.lg, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { flex: 1, color: Colors.textPrimary, fontSize: Typography.xl, fontFamily: Fonts.extrabold },
  host: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bubble: {
    flex: 1, backgroundColor: Colors.card, borderRadius: 16, borderTopLeftRadius: 4,
    borderWidth: 1, borderColor: Colors.glassBorder, paddingHorizontal: 14, paddingVertical: 10,
  },
  bubbleText: { color: Colors.textPrimary, fontSize: Typography.sm, fontFamily: Fonts.medium, lineHeight: 19 },
  roundNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  roundArrow: {
    width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.glass, borderWidth: 1, borderColor: Colors.glassBorder,
  },
  roundArrowOff: { opacity: 0.3 },
  roundArrowText: { color: Colors.textPrimary, fontSize: Typography.lg, fontFamily: Fonts.bold, marginTop: -2 },
  roundTitle: { color: Colors.textPrimary, fontSize: Typography.md, fontFamily: Fonts.extrabold },
  day: { gap: 8 },
  dayLabel: {
    color: Colors.primary, fontSize: Typography.xs, fontFamily: Fonts.bold,
    letterSpacing: 1.2, textTransform: 'uppercase', paddingLeft: 2, marginTop: 4,
  },
  card: { padding: 14, gap: 10 },
  cardTipped: { borderColor: Colors.primaryDim },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 22 },
  metaTime: { color: Colors.textSecondary, fontSize: Typography.xs + 1, fontFamily: Fonts.semibold },
  metaMuted: { color: Colors.textMuted, fontSize: Typography.xs + 1, fontFamily: Fonts.semibold },
  metaSaved: { color: Colors.primary, fontSize: Typography.xs + 1, fontFamily: Fonts.semibold },
  metaError: { color: Colors.danger, fontSize: Typography.xs + 1, fontFamily: Fonts.semibold, flexShrink: 1, textAlign: 'right' },
  livePill: { backgroundColor: Colors.danger, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  livePillText: { color: Colors.background, fontSize: Typography.xs - 1, fontFamily: Fonts.extrabold, letterSpacing: 0.8 },
  teamRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  teamName: { flex: 1, color: Colors.textPrimary, fontSize: Typography.base, fontFamily: Fonts.semibold },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepBtn: {
    width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.cardElevated, borderWidth: 1, borderColor: Colors.glassBorder,
  },
  stepBtnPressed: { backgroundColor: Colors.glowGreen, borderColor: Colors.primary },
  stepBtnOff: { opacity: 0.35 },
  stepBtnText: { color: Colors.textPrimary, fontSize: Typography.lg, fontFamily: Fonts.bold, marginTop: -2 },
  stepValue: {
    width: 30, textAlign: 'center', color: Colors.textPrimary,
    fontSize: Typography.xl, fontFamily: Fonts.black,
  },
  stepValueEmpty: { color: Colors.textMuted },
  resultValue: {
    minWidth: 40, textAlign: 'right', color: Colors.textPrimary,
    fontSize: Typography.xl, fontFamily: Fonts.black,
  },
  tipsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  yourTip: { color: Colors.textSecondary, fontSize: Typography.xs + 1, fontFamily: Fonts.medium },
  betinaTip: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 'auto' },
  betinaTipText: { color: Colors.accentLight, fontSize: Typography.xs + 1, fontFamily: Fonts.bold },
  betinaLocked: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  betinaLockedText: { color: Colors.textMuted, fontSize: Typography.xs, fontFamily: Fonts.semibold },
  emptyCard: { padding: 20, alignItems: 'center' },
  emptyText: { color: Colors.textSecondary, fontSize: Typography.sm, fontFamily: Fonts.medium, textAlign: 'center' },
});
