// Building blocks of BETina Live (urban design): crests, the minute / status
// chip, match rows with the goal flash, league headers, the "live now" cards
// and the follow star. Scores only — no odds anywhere.
import React, { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { Blink, Meta } from '../Urban';
import { FollowKind, isFollowing, toggleFollow, useFollows } from '../../lib/follows';
import { useI18n } from '../../lib/i18n';
import { Row, isFinished, isLive, isOff, kickoffTime, leagueLogo, minuteOf, teamLogo } from '../../lib/live';
import { TipRef, tipPoints } from '../../lib/liveTips';
import { Colors, Fonts, displayType } from '../../theme';

const FLASH_MS = 90_000;

// ── Crest ────────────────────────────────────────────────────────────────────
export function Crest({ id, name, size = 22 }: { id: number; name: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    const initials = name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
    return (
      <View style={[styles.crestFallback, { width: size, height: size }]}>
        <Text style={[styles.crestInitials, { fontSize: size * 0.4 }]}>{initials}</Text>
      </View>
    );
  }
  return <Image source={{ uri: teamLogo(id) }} style={{ width: size, height: size }} resizeMode="contain" onError={() => setFailed(true)} />;
}

export function LeagueLogo({ id, size = 18 }: { id: number; size?: number }) {
  return (
    <View style={[styles.leagueLogo, { width: size + 6, height: size + 6 }]}>
      <Image source={{ uri: leagueLogo(id) }} style={{ width: size, height: size }} resizeMode="contain" />
    </View>
  );
}

// ── Status ───────────────────────────────────────────────────────────────────
/** Minute for live matches (red, blinking), kick-off time, FT or the off-state. */
export function useStatusLabel(r: Pick<Row, 'st' | 'min' | 'ex' | 'ts'>) {
  const { t, lang } = useI18n();
  const live = isLive(r.st);
  if (live) return { text: r.st === 'HT' ? t.liveHT : minuteOf(r) ?? 'LIVE', live: true, done: false };
  if (isFinished(r.st)) return { text: r.st === 'AET' ? t.liveAET : r.st === 'PEN' ? t.livePens : t.liveFT, live: false, done: true };
  if (isOff(r.st)) return { text: r.st === 'PST' ? t.liveStPST : r.st === 'CANC' ? t.liveStCANC : t.liveStABD, live: false, done: true };
  return { text: kickoffTime(r.ts, lang), live: false, done: false };
}

/** A live minute that pulses. */
export function LiveMinute({ text, size = 13 }: { text: string; size?: number }) {
  return (
    <View style={styles.liveMinute}>
      <Blink size={5} />
      <Text style={[styles.liveMinuteText, { fontSize: size }]}>{text}</Text>
    </View>
  );
}

// ── Follow star ──────────────────────────────────────────────────────────────
export function Star({ kind, refId, label, size = 20 }: { kind: FollowKind; refId: number; label: string; size?: number }) {
  useFollows();
  const on = isFollowing(kind, refId);
  const pop = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
  return (
    <Pressable
      hitSlop={10}
      onPress={() => {
        Haptics.impactAsync(on ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium);
        pop.value = withSequence(withTiming(1.35, { duration: 110 }), withTiming(1, { duration: 160 }));
        toggleFollow(kind, refId, label);
      }}
      accessibilityRole="button"
    >
      <Animated.Text style={[{ fontSize: size, lineHeight: size + 4, color: on ? Colors.primary : Colors.textFaint }, style]}>{on ? '★' : '☆'}</Animated.Text>
    </Pressable>
  );
}

// ── Red cards ────────────────────────────────────────────────────────────────
export function RedCards({ n }: { n: number }) {
  if (!n) return null;
  return (
    <View style={styles.reds}>
      {Array.from({ length: Math.min(n, 3) }, (_, i) => <View key={i} style={styles.redCard} />)}
    </View>
  );
}

// ── Goal flash (lime pulse for a fresh goal) ────────────────────────────────
function useFlash(goalAt: number | null | undefined, serverNow: number) {
  const fresh = !!goalAt && serverNow - goalAt < FLASH_MS;
  const v = useSharedValue(0);
  useEffect(() => {
    if (fresh) v.value = withRepeat(withSequence(withTiming(1, { duration: 450, easing: Easing.out(Easing.quad) }), withTiming(0.25, { duration: 650 })), 6, false);
    else v.value = withTiming(0, { duration: 300 });
  }, [fresh, goalAt, v]);
  return { fresh, style: useAnimatedStyle(() => ({ opacity: v.value * 0.22 })) };
}

// ── Match row ────────────────────────────────────────────────────────────────
export function MatchRow({ r, serverNow, tip, onPress, last }: { r: Row; serverNow: number; tip?: TipRef; onPress: () => void; last?: boolean }) {
  const status = useStatusLabel(r);
  const { fresh, style: flash } = useFlash(r.goalAt, serverNow);
  const started = r.g[0] != null;
  const winner = isFinished(r.st) && started ? (r.g[0]! > r.g[1]! ? 0 : r.g[0]! < r.g[1]! ? 1 : -1) : -1;
  const pts = tip && started ? tipPoints(tip.mine, r.g) : null;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, last && { borderBottomWidth: 0 }, pressed && styles.rowPressed]}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.primary }, flash]} pointerEvents="none" />
      <View style={styles.rowTime}>
        {status.live
          ? <LiveMinute text={status.text} />
          : <Text style={[styles.rowTimeText, status.done && { color: Colors.textMuted }]} numberOfLines={1}>{status.text}</Text>}
      </View>
      <View style={styles.rowTeams}>
        {[r.h, r.a].map((team, s) => (
          <View key={s} style={styles.rowTeam}>
            <Crest id={team.id} name={team.n} size={20} />
            <Text style={[styles.rowName, winner >= 0 && winner !== s && styles.rowNameLost]} numberOfLines={1}>{team.n.toUpperCase()}</Text>
            <RedCards n={r.red?.[s] ?? 0} />
          </View>
        ))}
      </View>
      {tip?.mine && (
        <View style={[styles.tip, pts != null && pts > 0 && styles.tipHit]}>
          <Text style={[styles.tipText, pts != null && pts > 0 && { color: Colors.black }]}>{tip.mine.join(':')}</Text>
          {pts != null && <Text style={[styles.tipPts, pts > 0 && { color: Colors.black }]}>+{pts}</Text>}
        </View>
      )}
      <View style={styles.rowScore}>
        {[0, 1].map((s) => (
          <Text key={s} style={[styles.score, !started && styles.scoreEmpty, status.live && styles.scoreLive, fresh && styles.scoreFresh, winner >= 0 && winner !== s && styles.rowNameLost]}>
            {started ? r.g[s] : '–'}
          </Text>
        ))}
      </View>
    </Pressable>
  );
}

// ── League header ────────────────────────────────────────────────────────────
export function LeagueHeader({ id, name, country, count, live, open, onToggle }: {
  id: number; name: string; country: string; count: number; live: number; open: boolean; onToggle: () => void;
}) {
  const { t } = useI18n();
  return (
    <Pressable onPress={onToggle} style={({ pressed }) => [styles.league, pressed && styles.rowPressed]}>
      <LeagueLogo id={id} />
      <View style={styles.leagueText}>
        <Meta numberOfLines={1}>{country}</Meta>
        <Text style={styles.leagueName} numberOfLines={1}>{name.toUpperCase()}</Text>
      </View>
      {live > 0 && <View style={styles.leagueLive}><Text style={styles.leagueLiveText}>{t.liveNowCount.replace('{n}', String(live)).toUpperCase()}</Text></View>}
      {!open && <Meta>{t.liveMatches.replace('{n}', String(count))}</Meta>}
      <Star kind="league" refId={id} label={name} size={18} />
      <Text style={styles.chev}>{open ? '–' : '+'}</Text>
    </Pressable>
  );
}

// ── "Live now" card (carousel) ───────────────────────────────────────────────
export function LiveCard({ r, league, serverNow, onPress }: { r: Row; league: string; serverNow: number; onPress: () => void }) {
  const status = useStatusLabel(r);
  const { fresh, style: flash } = useFlash(r.goalAt, serverNow);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, fresh && styles.cardFresh, pressed && { borderColor: Colors.primary }]}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.primary }, flash]} pointerEvents="none" />
      <View style={styles.cardTop}>
        <Meta numberOfLines={1} style={{ flex: 1 }}>{league}</Meta>
        <LiveMinute text={status.text} size={12} />
      </View>
      {[r.h, r.a].map((team, s) => (
        <View key={s} style={styles.cardTeam}>
          <Crest id={team.id} name={team.n} size={26} />
          <Text style={styles.cardName} numberOfLines={1}>{team.n.toUpperCase()}</Text>
          <RedCards n={r.red?.[s] ?? 0} />
          <Text style={[styles.cardScore, fresh && { color: Colors.primary }]}>{r.g[s] ?? 0}</Text>
        </View>
      ))}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  crestFallback: { backgroundColor: Colors.cardElevated, alignItems: 'center', justifyContent: 'center' },
  crestInitials: { color: Colors.textSecondary, fontFamily: Fonts.label },
  leagueLogo: { backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },

  liveMinute: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  liveMinuteText: { color: Colors.live, fontFamily: Fonts.monoBold },

  reds: { flexDirection: 'row', gap: 2, marginLeft: 2 },
  redCard: { width: 7, height: 10, backgroundColor: Colors.live },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.line, backgroundColor: Colors.card, overflow: 'hidden',
  },
  rowPressed: { backgroundColor: Colors.cardElevated },
  rowTime: { width: 50 },
  rowTimeText: { color: Colors.white, fontSize: 13, fontFamily: Fonts.monoBold },
  rowTeams: { flex: 1, gap: 7 },
  rowTeam: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowName: { color: Colors.white, fontSize: 15, fontFamily: Fonts.label, letterSpacing: 0.3, flexShrink: 1 },
  rowNameLost: { color: Colors.textMuted },
  rowScore: { width: 26, alignItems: 'flex-end', gap: 1 },
  score: { ...displayType(21, 26), color: Colors.white },
  scoreEmpty: { color: Colors.textFaint },
  scoreLive: { color: Colors.white },
  scoreFresh: { color: Colors.primary },

  tip: { borderWidth: 1.5, borderColor: Colors.primary, paddingHorizontal: 5, paddingVertical: 2, alignItems: 'center' },
  tipHit: { backgroundColor: Colors.primary },
  tipText: { color: Colors.primary, fontSize: 11, fontFamily: Fonts.monoBold },
  tipPts: { color: Colors.textSecondary, fontSize: 9, fontFamily: Fonts.monoBold },

  league: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: Colors.surface, borderTopWidth: 1.5, borderTopColor: Colors.border,
  },
  leagueText: { flex: 1, gap: 1 },
  leagueName: { color: Colors.white, fontSize: 16, fontFamily: Fonts.label, letterSpacing: 0.4 },
  leagueLive: { backgroundColor: Colors.live, paddingHorizontal: 6, paddingVertical: 2 },
  leagueLiveText: { color: Colors.white, fontSize: 10, fontFamily: Fonts.monoBold },
  chev: { color: Colors.textMuted, fontSize: 20, fontFamily: Fonts.label, width: 14, textAlign: 'center' },

  card: {
    width: 236, padding: 12, gap: 8, backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.border, overflow: 'hidden',
  },
  cardFresh: { borderColor: Colors.primary },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTeam: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardName: { flex: 1, color: Colors.white, fontSize: 16, fontFamily: Fonts.label, letterSpacing: 0.3 },
  cardScore: { ...displayType(30, 34), color: Colors.white, minWidth: 20, textAlign: 'right' },
});

