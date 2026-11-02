// "Your game" on Home: the games starred in Live (followed matches and teams)
// first, then the favourite team's next match. With more than one, the card
// changes every few seconds; the dots switch by hand. Both team names share
// one size, so a long name never squeezes the other one.
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Meta } from './Urban';
import { useFollows } from '../lib/follows';
import { useI18n } from '../lib/i18n';
import { useContentWidth } from '../lib/layout';
import { League, Row, fetchNext, minuteOf, sameTeam, useLiveNow } from '../lib/live';
import { MatchEvent, formatKickoff } from '../lib/sports';
import { Colors, Fonts, displayType } from '../theme';

type Game = {
  key: string; league: string; when: string; home: string; away: string; kickoff: Date;
  matchId?: number; score?: string; minute?: string | null;
};

const ROTATE_MS = 7000;
const kickoffOf = (e: MatchEvent) => new Date(`${e.date}T${e.time || '00:00:00'}`);

/** Days / hours / minutes / seconds until kickoff, ticking every second. */
function useCountdown(target: Date | null) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);
  if (!target) return null;
  const s = Math.max(0, Math.floor((target.getTime() - now) / 1000));
  return { hoursTotal: Math.floor(s / 3600), parts: [Math.floor(s / 86400), Math.floor(s / 3600) % 24, Math.floor(s / 60) % 60, s % 60] };
}

export default function YourGames({ favourite, loading, team, onPickTeam }: {
  favourite: MatchEvent | null; loading: boolean; team: string | null | undefined; onPickTeam: () => void;
}) {
  const { t, lang } = useI18n();
  const router = useRouter();
  const follows = useFollows();
  const live = useLiveNow(null);
  const width = useContentWidth();
  const [starred, setStarred] = useState<{ r: Row; lg: League }[]>([]);
  const [idx, setIdx] = useState(0);

  const teamIds = follows.filter((f) => f.kind === 'team').map((f) => f.ref).join(',');
  const matchIds = follows.filter((f) => f.kind === 'match').map((f) => f.ref).join(',');
  useEffect(() => {
    if (!teamIds && !matchIds) { setStarred([]); return; }
    let active = true;
    fetchNext(teamIds, matchIds).then((g) => { if (active) setStarred(g); }).catch(() => {});
    return () => { active = false; };
  }, [teamIds, matchIds]);

  const labels = { today: t.homeToday, tomorrow: t.homeTomorrow };
  const games = useMemo<Game[]>(() => {
    const list: Game[] = starred
      .map(({ r: base, lg }) => {
        // The shared live poll is fresher than our snapshot.
        const r = live?.matches.find((m) => m.id === base.id) ?? base;
        const d = new Date(r.ts * 1000);
        const hhmm = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
        const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const minute = minuteOf(r);
        return {
          key: `m${r.id}`, league: lg.name, when: formatKickoff(iso, `${hhmm}:00`, lang, labels),
          home: r.h.n, away: r.a.n, kickoff: d, matchId: r.id, minute,
          score: minute ? `${r.g[0] ?? 0} – ${r.g[1] ?? 0}` : undefined,
        };
      })
      .sort((a, b) => a.kickoff.getTime() - b.kickoff.getTime());
    if (favourite && kickoffOf(favourite).getTime() > Date.now()) {
      const k = kickoffOf(favourite);
      const dup = list.some((g) => (sameTeam(g.home, favourite.home) || sameTeam(g.away, favourite.away))
        && Math.abs(g.kickoff.getTime() - k.getTime()) < 3 * 3_600_000);
      if (!dup) {
        list.push({
          key: `f${favourite.id}`, league: favourite.league, when: formatKickoff(favourite.date, favourite.time, lang, labels),
          home: favourite.home, away: favourite.away, kickoff: k,
        });
      }
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- labels follow lang
  }, [starred, favourite, live, lang]);

  // Rotate; any change (timer or a dot) starts the wait again.
  useEffect(() => {
    if (games.length < 2) return;
    const id = setTimeout(() => setIdx((i) => (i + 1) % games.length), ROTATE_MS);
    return () => clearTimeout(id);
  }, [idx, games.length]);

  const g = games.length ? games[idx % games.length] : null;
  const countdown = useCountdown(g && !g.minute ? g.kickoff : null);
  const units = t.homeCountdownUnits.split('|');

  // One size for both names, fitted to the longer one (Anton ≈ half an em wide).
  const inner = width - 32 - 32;
  const longest = g ? Math.max(g.home.length, g.away.length, 6) : 10;
  const nameSize = Math.max(24, Math.min(44, Math.floor(inner / (longest * 0.52))));

  let body: React.ReactNode;
  if (g) {
    const open = g.matchId != null
      ? () => { Haptics.selectionAsync(); router.push({ pathname: '/match/[id]', params: { id: String(g.matchId) } }); }
      : undefined;
    body = (
      <Animated.View key={g.key} entering={FadeIn.duration(300)}>
        <Pressable onPress={open} disabled={!open} style={({ pressed }) => [styles.game, pressed && { opacity: 0.9 }]}>
          <Meta color={Colors.black} style={{ fontFamily: Fonts.monoBold }} numberOfLines={1}>{`${g.league} · ${g.when}`}</Meta>
          <View>
            <Text style={[styles.team, displayType(nameSize, nameSize + 2)]} numberOfLines={1}>{g.home.toUpperCase()}</Text>
            <Text style={styles.vs}>VS</Text>
            <Text style={[styles.team, displayType(nameSize, nameSize + 2)]} numberOfLines={1}>{g.away.toUpperCase()}</Text>
          </View>
          {g.minute ? (
            <View style={styles.liveBar}>
              <Text style={styles.liveScore}>{g.score}</Text>
              <Text style={styles.liveMinute}>{g.minute}</Text>
            </View>
          ) : countdown && (
            <View style={styles.countdown}>
              {countdown.parts.map((v, i) => (
                <View key={i} style={styles.cdBox}>
                  <Text style={styles.cdValue}>{String(v).padStart(2, '0')}</Text>
                  <Text style={styles.cdUnit}>{(units[i] ?? '').toUpperCase()}</Text>
                </View>
              ))}
            </View>
          )}
        </Pressable>
      </Animated.View>
    );
  } else if (loading) {
    body = <View style={styles.emptyCard}><ActivityIndicator color={Colors.primary} /></View>;
  } else if (!team) {
    body = (
      <Pressable onPress={onPickTeam} style={styles.emptyCard}>
        <Text style={styles.emptyText}>{t.homePickTeam}</Text>
      </Pressable>
    );
  } else {
    body = <View style={styles.emptyCard}><Text style={styles.emptyText}>{t.homeNoFixtures.replace('{team}', team)}</Text></View>;
  }

  return (
    <View>
      <View style={styles.sectionRow}>
        <Text style={styles.section}>{t.homeYourGame.toUpperCase()}</Text>
        {g?.minute
          ? <Meta color={Colors.live}>LIVE</Meta>
          : countdown && <Meta color={Colors.primary}>{t.homeInHours.replace('{n}', String(countdown.hoursTotal))}</Meta>}
      </View>
      {body}
      {games.length > 1 && (
        <View style={styles.dots}>
          {games.map((x, i) => (
            <Pressable key={x.key} onPress={() => setIdx(i)} hitSlop={8} style={[styles.dot, i === idx % games.length && styles.dotOn]} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 },
  section: { color: Colors.white, fontSize: 34, fontFamily: Fonts.display },
  emptyCard: { borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface, padding: 18, minHeight: 80, justifyContent: 'center' },
  emptyText: { color: Colors.textSecondary, fontSize: 15, lineHeight: 21, fontFamily: Fonts.medium },
  game: { backgroundColor: Colors.primary, padding: 16, gap: 12 },
  team: { color: Colors.black },
  vs: { color: Colors.black, opacity: 0.45, fontSize: 16, fontFamily: Fonts.display, marginVertical: 2 },
  countdown: { flexDirection: 'row', gap: 8 },
  cdBox: { flex: 1, backgroundColor: Colors.black, paddingVertical: 8, alignItems: 'center' },
  cdValue: { ...displayType(30, 32), color: Colors.primary },
  cdUnit: { color: Colors.white, fontSize: 9, fontFamily: Fonts.mono, letterSpacing: 1 },
  liveBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.black, paddingVertical: 8, paddingHorizontal: 14 },
  liveScore: { ...displayType(34, 36), color: Colors.primary },
  liveMinute: { color: Colors.live, fontSize: 14, fontFamily: Fonts.monoBold, letterSpacing: 1 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 },
  dot: { width: 18, height: 4, backgroundColor: Colors.borderStrong },
  dotOn: { backgroundColor: Colors.primary, width: 28 },
});
