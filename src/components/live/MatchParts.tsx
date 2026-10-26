// The match page of BETina Live: scoreboard with the match timeline, BETina's
// take, the Tippspiel tip, and the tabs — ticker (home left, away right),
// stats (animated bars), lineups on a pitch, live table and head-to-head.
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, FadeIn, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { Meta } from '../Urban';
import { Crest, LiveMinute, RedCards, Star, useStatusLabel } from './LiveParts';
import { useI18n } from '../../lib/i18n';
import {
  H2H, Lineup, MatchDetail, MatchEvent, Person, Row, TableRow, isFinished, isLive,
} from '../../lib/live';
import { TipRef, tipPoints } from '../../lib/liveTips';
import { Colors, Fonts, withAlpha } from '../../theme';

type T = ReturnType<typeof useI18n>['t'];

// ── Scoreboard ───────────────────────────────────────────────────────────────
function scorerLines(m: MatchDetail, side: 0 | 1): string[] {
  const goals = m.events.filter((e) => e.t === 'Goal' && !/missed/i.test(e.d) && e.s === side);
  const by = new Map<string, string[]>();
  for (const g of goals) {
    const name = g.p ?? '?';
    const tag = /own/i.test(g.d) ? ' (OG)' : /penalty/i.test(g.d) ? ' (P)' : '';
    by.set(name, [...(by.get(name) ?? []), `${g.m ?? ''}${g.x ? `+${g.x}` : ''}'${tag}`]);
  }
  return [...by.entries()].map(([n, mins]) => `${n} ${mins.join(', ')}`);
}

export function Scoreboard({ m }: { m: MatchDetail }) {
  const { t } = useI18n();
  const status = useStatusLabel(m);
  const started = m.g[0] != null;
  const live = isLive(m.st);
  return (
    <View style={styles.board}>
      <View style={styles.boardRow}>
        {([m.h, m.a] as const).map((team, s) => (
          <View key={s} style={styles.boardTeam}>
            <Crest id={team.id} name={team.n} size={68} />
            <Text style={styles.boardName} numberOfLines={2}>{team.n.toUpperCase()}</Text>
            <View style={styles.boardMeta}>
              <RedCards n={m.red?.[s] ?? 0} />
              <Star kind="team" refId={team.id} label={team.n} size={18} />
            </View>
          </View>
        ))}
        <View style={styles.boardCenter} pointerEvents="box-none">
          <Text style={[styles.boardScore, live && { color: Colors.primary }]}>{started ? `${m.g[0]}:${m.g[1]}` : 'VS'}</Text>
          {live ? <LiveMinute text={status.text} size={16} /> : <Meta color={status.done ? Colors.textMuted : Colors.primary} size={12}>{status.text}</Meta>}
          {m.ht && (live || isFinished(m.st)) && m.st !== '1H' && <Meta size={10}>{`${t.liveHT} ${m.ht[0]}:${m.ht[1]}`}</Meta>}
          {m.pen && <Meta size={10} color={Colors.primary}>{`${t.livePens} ${m.pen[0]}:${m.pen[1]}`}</Meta>}
        </View>
      </View>
      <View style={styles.scorers}>
        {([0, 1] as const).map((s) => (
          <View key={s} style={[styles.scorerCol, s === 1 && { alignItems: 'flex-end' }]}>
            {scorerLines(m, s).map((l, i) => <Text key={i} style={[styles.scorer, s === 1 && { textAlign: 'right' }]} numberOfLines={1}>{`⚽ ${l}`}</Text>)}
          </View>
        ))}
      </View>
      <Timeline m={m} />
    </View>
  );
}

/** 0–90' bar: played time in lime, goals and red cards as markers. */
function Timeline({ m }: { m: MatchDetail }) {
  const [w, setW] = useState(0);
  const total = m.st === 'ET' || m.st === 'P' || m.st === 'AET' || m.st === 'PEN' || (m.min ?? 0) > 95 ? 120 : 90;
  const played = isFinished(m.st) ? total : isLive(m.st) ? Math.min(total, m.min ?? 0) : 0;
  const fill = useSharedValue(0);
  useEffect(() => { fill.value = withTiming(played / total, { duration: 900, easing: Easing.out(Easing.cubic) }); }, [played, total, fill]);
  const fillStyle = useAnimatedStyle(() => ({ width: `${fill.value * 100}%` }));
  const marks = m.events.filter((e) => (e.t === 'Goal' && !/missed/i.test(e.d)) || (e.t === 'Card' && /red/i.test(e.d)));
  if (!played && !marks.length) return null;
  return (
    <View style={styles.timeline} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      <View style={styles.timeTrack}>
        <Animated.View style={[styles.timeFill, fillStyle]} />
        <View style={[styles.timeHalf, { left: `${(45 / total) * 100}%` }]} />
      </View>
      {w > 0 && marks.map((e, i) => {
        const x = Math.min(1, ((e.m ?? 0) + (e.x ?? 0)) / total) * w;
        const goal = e.t === 'Goal';
        return (
          <View key={i} style={[styles.mark, { left: x - 5, top: e.s === 0 ? -9 : 9 }, goal ? styles.markGoal : styles.markRed]} />
        );
      })}
    </View>
  );
}

// ── BETina's take + tip ──────────────────────────────────────────────────────
export function TakeCard({ text, loading }: { text: string | null; loading: boolean }) {
  const { t } = useI18n();
  if (!text && !loading) return null;
  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.take}>
      <Image source={require('../../../assets/urban/betina-avatar.jpg')} style={styles.takeAvatar} />
      <View style={{ flex: 1, gap: 4 }}>
        <Meta color={Colors.primary}>{t.liveTakeTitle}</Meta>
        {text ? <Text style={styles.takeText}>{text}</Text> : <ActivityIndicator color={Colors.primary} style={{ alignSelf: 'flex-start' }} />}
      </View>
    </Animated.View>
  );
}

export function TipCard({ tip, g, live }: { tip: TipRef; g: Row['g']; live: boolean }) {
  const { t } = useI18n();
  const pts = tipPoints(tip.mine, g);
  const herPts = tipPoints(tip.betina, g);
  return (
    <View style={styles.tipCard}>
      <View style={styles.tipSide}>
        <Meta color={Colors.black}>{t.liveYourTip}</Meta>
        <Text style={styles.tipScore}>{tip.mine?.join(':') ?? '–'}</Text>
      </View>
      {pts != null && (
        <View style={styles.tipMid}>
          <Text style={styles.tipPts}>+{pts}</Text>
          <Meta color={Colors.black} size={9}>{live ? (pts > 0 ? t.livePtsNow.replace('{n}', String(pts)) : t.livePtsZero) : 'TIPPSPIEL'}</Meta>
        </View>
      )}
      {tip.betina && (
        <View style={[styles.tipSide, { alignItems: 'flex-end' }]}>
          <Meta color={Colors.black}>{`BETINA${herPts != null ? ` +${herPts}` : ''}`}</Meta>
          <Text style={styles.tipScore}>{tip.betina.join(':')}</Text>
        </View>
      )}
    </View>
  );
}

// ── Ticker ───────────────────────────────────────────────────────────────────
function eventLabel(e: MatchEvent, t: T) {
  if (e.t === 'Goal') {
    if (/missed/i.test(e.d)) return t.liveEvMissedPen;
    if (/own/i.test(e.d)) return t.liveEvOwnGoal;
    if (/penalty/i.test(e.d)) return t.liveEvPenalty;
    return t.liveEvGoal;
  }
  if (e.t === 'Card') return /second/i.test(e.d) ? t.liveEvSecondYellow : /red/i.test(e.d) ? t.liveEvRed : t.liveEvYellow;
  if (e.t === 'subst') return t.liveEvSub;
  if (e.t === 'Var') return `${t.liveEvVar} · ${e.d}`;
  return e.d || e.t;
}

function EventIcon({ e }: { e: MatchEvent }) {
  if (e.t === 'Goal' && !/missed/i.test(e.d)) return <View style={styles.iconGoal}><Text style={styles.iconGoalText}>⚽</Text></View>;
  if (e.t === 'Card') {
    const red = /red|second/i.test(e.d);
    return <View style={[styles.iconCard, { backgroundColor: red ? Colors.live : Colors.gold }]} />;
  }
  if (e.t === 'subst') return <Text style={styles.iconSub}>⇄</Text>;
  return <Text style={styles.iconVar}>{e.t === 'Var' ? 'VAR' : '•'}</Text>;
}

export function TickerTab({ m }: { m: MatchDetail }) {
  const { t, lang } = useI18n();
  const events = [...m.events].sort((a, b) => ((b.m ?? 0) + (b.x ?? 0) / 100) - ((a.m ?? 0) + (a.x ?? 0) / 100));
  type Line = { kind: 'e'; e: MatchEvent } | { kind: 'mark'; text: string };
  const lines: Line[] = [];
  if (isFinished(m.st)) lines.push({ kind: 'mark', text: `${t.liveFulltime} · ${m.g[0]}:${m.g[1]}` });
  let htDone = !(m.ht && m.st !== '1H');
  for (const e of events) {
    if (!htDone && (e.m ?? 0) <= 45) {
      lines.push({ kind: 'mark', text: `${t.liveHalftime} · ${m.ht![0]}:${m.ht![1]}` });
      htDone = true;
    }
    lines.push({ kind: 'e', e });
  }
  if (!htDone) lines.push({ kind: 'mark', text: `${t.liveHalftime} · ${m.ht![0]}:${m.ht![1]}` });
  if (m.g[0] != null) lines.push({ kind: 'mark', text: t.liveKickoff });

  if (!events.length) {
    return (
      <View style={styles.emptyTab}>
        <Text style={styles.emptyText}>{m.g[0] == null ? `${t.liveKickoff} ${new Date(m.ts * 1000).toLocaleString(lang, { weekday: 'short', hour: '2-digit', minute: '2-digit' })}` : t.liveNoEvents}</Text>
      </View>
    );
  }
  return (
    <View style={styles.ticker}>
      <View style={styles.tickerSpine} />
      {lines.map((l, i) => {
        if (l.kind === 'mark') {
          return (
            <View key={i} style={styles.tickMark}>
              <Text style={styles.tickMarkText}>{l.text.toUpperCase()}</Text>
            </View>
          );
        }
        const e = l.e;
        const goal = e.t === 'Goal' && !/missed/i.test(e.d);
        const body = (
          <View style={[styles.tickBody, e.s === 1 && { alignItems: 'flex-start' }, goal && styles.tickGoal]}>
            <View style={[styles.tickHead, e.s === 0 && { flexDirection: 'row-reverse' }]}>
              <EventIcon e={e} />
              <Text style={[styles.tickType, goal && { color: Colors.primary }]} numberOfLines={1}>{eventLabel(e, t).toUpperCase()}</Text>
            </View>
            {!!e.p && <Text style={[styles.tickPlayer, e.s === 0 && { textAlign: 'right' }]} numberOfLines={2}>{e.t === 'subst' && e.as ? `${e.p} ⇄ ${e.as}` : e.p}</Text>}
            {goal && !!e.as && <Text style={[styles.tickSub, e.s === 0 && { textAlign: 'right' }]} numberOfLines={1}>{t.liveAssist.replace('{p}', e.as)}</Text>}
          </View>
        );
        return (
          <View key={i} style={styles.tickRow}>
            <View style={styles.tickSide}>{e.s === 0 ? body : null}</View>
            <View style={[styles.tickMin, goal && styles.tickMinGoal]}>
              <Text style={[styles.tickMinText, goal && { color: Colors.black }]}>{`${e.m ?? ''}${e.x ? `+${e.x}` : ''}'`}</Text>
            </View>
            <View style={styles.tickSide}>{e.s === 1 ? body : null}</View>
          </View>
        );
      })}
    </View>
  );
}

// ── Stats ────────────────────────────────────────────────────────────────────
const STAT_ORDER: [string, keyof T][] = [
  ['Ball Possession', 'liveSPoss'], ['expected_goals', 'liveSXg'], ['Total Shots', 'liveSShots'], ['Shots on Goal', 'liveSOnTarget'],
  ['Shots off Goal', 'liveSOffTarget'], ['Blocked Shots', 'liveSBlocked'], ['Shots insidebox', 'liveSInside'], ['Shots outsidebox', 'liveSOutside'],
  ['Corner Kicks', 'liveSCorners'], ['Offsides', 'liveSOffsides'], ['Fouls', 'liveSFouls'], ['Yellow Cards', 'liveSYellow'],
  ['Red Cards', 'liveSRed'], ['Goalkeeper Saves', 'liveSSaves'], ['Total passes', 'liveSPasses'], ['Passes accurate', 'liveSPassesAcc'], ['Passes %', 'liveSPassPct'],
];
const num = (v: number | string | null) => (v == null ? 0 : typeof v === 'number' ? v : parseFloat(v) || 0);

function StatBar({ share, lead, delay, right }: { share: number; lead: boolean; delay: number; right?: boolean }) {
  const w = useSharedValue(0);
  useEffect(() => { w.value = withDelay(delay, withTiming(share, { duration: 800, easing: Easing.out(Easing.cubic) })); }, [share, delay, w]);
  const style = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));
  return (
    <View style={[styles.barTrack, right ? { alignItems: 'flex-start' } : { alignItems: 'flex-end' }]}>
      <Animated.View style={[styles.barFill, { backgroundColor: lead ? Colors.primary : Colors.borderStrong }, style]} />
    </View>
  );
}

export function StatsTab({ m }: { m: MatchDetail }) {
  const { t } = useI18n();
  const rows = STAT_ORDER.map(([type, key]) => ({ s: m.stats.find((x) => x.type === type), label: t[key] as string })).filter((x) => x.s);
  if (!rows.length) return <View style={styles.emptyTab}><Text style={styles.emptyText}>{t.liveNoStats}</Text></View>;
  return (
    <View style={styles.stats}>
      <View style={styles.statsHead}>
        <Crest id={m.h.id} name={m.h.n} size={24} />
        <Meta>{t.liveTabStats}</Meta>
        <Crest id={m.a.id} name={m.a.n} size={24} />
      </View>
      {rows.map(({ s, label }, i) => {
        const h = num(s!.h);
        const a = num(s!.a);
        const sum = h + a || 1;
        return (
          <View key={s!.type} style={styles.stat}>
            <View style={styles.statLabels}>
              <Text style={[styles.statVal, h > a && { color: Colors.primary }]}>{s!.h ?? 0}</Text>
              <Text style={styles.statName}>{label.toUpperCase()}</Text>
              <Text style={[styles.statVal, a > h && { color: Colors.primary }]}>{s!.a ?? 0}</Text>
            </View>
            <View style={styles.statBars}>
              <StatBar share={h / sum} lead={h >= a && h > 0} delay={i * 40} />
              <StatBar share={a / sum} lead={a >= h && a > 0} delay={i * 40} right />
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ── Lineups on a pitch ───────────────────────────────────────────────────────
const shortName = (n: string) => { const parts = n.split(' '); return parts.length > 1 ? parts.slice(1).join(' ') : n; };
const hex = (c?: string) => (c && /^[0-9a-f]{6}$/i.test(c) ? `#${c}` : null);

function ratingColor(r: number | null) {
  if (r == null) return Colors.borderStrong;
  if (r >= 7.5) return Colors.primary;
  if (r >= 6.5) return Colors.white;
  if (r >= 6) return Colors.warning;
  return Colors.live;
}

function PitchPlayer({ p, x, y, color, numColor, rating }: { p: Person; x: number; y: number; color: string; numColor: string; rating?: MatchDetail['ratings'][string] }) {
  return (
    <View style={[styles.pp, { left: x - 34, top: y - 18 }]}>
      <View style={[styles.ppShirt, { backgroundColor: color }]}>
        <Text style={[styles.ppNo, { color: numColor }]}>{p.no ?? ''}</Text>
        {rating?.r != null && (
          <View style={[styles.ppRating, { backgroundColor: ratingColor(rating.r) }]}>
            <Text style={styles.ppRatingText}>{rating.r.toFixed(1)}</Text>
          </View>
        )}
        {!!rating?.g && <Text style={styles.ppGoal}>{'⚽'.repeat(Math.min(rating.g, 3))}</Text>}
        {(rating?.rd ?? 0) > 0 && <View style={styles.ppRed} />}
      </View>
      <Text style={styles.ppName} numberOfLines={1}>{`${shortName(p.n)}${rating?.c ? ' (C)' : ''}`}</Text>
    </View>
  );
}

export function LineupsTab({ m }: { m: MatchDetail }) {
  const { t } = useI18n();
  const { width } = useWindowDimensions();
  const W = Math.min(width - 32, 520);
  const H = W * 1.8;
  if (!m.lineups.length) return <View style={styles.emptyTab}><Text style={styles.emptyText}>{t.liveNoLineups}</Text></View>;

  const place = (l: Lineup) => {
    const rows = new Map<number, Person[]>();
    for (const p of l.xi) {
      const [r] = (p.grid ?? '1:1').split(':').map(Number);
      rows.set(r, [...(rows.get(r) ?? []), p]);
    }
    const count = Math.max(...rows.keys(), 1);
    const half = H / 2;
    return l.xi.map((p) => {
      const [r, c] = (p.grid ?? '1:1').split(':').map(Number);
      const inRow = rows.get(r)?.length ?? 1;
      const depth = (r - 0.5) / count; // 0 = own goal
      const yHome = H - 26 - depth * (half - 40);
      const y = l.s === 0 ? yHome : H - yHome;
      const xs = ((c - 0.5) / inRow) * W;
      const x = l.s === 0 ? xs : W - xs;
      return { p, x, y };
    });
  };

  const home = m.lineups.find((l) => l.s === 0);
  const away = m.lineups.find((l) => l.s === 1);
  const colorsOf = (l: Lineup | undefined, fallback: string) => ({
    color: hex(l?.colors?.player?.primary) ?? fallback,
    numColor: hex(l?.colors?.player?.number) ?? Colors.black,
  });
  const hc = colorsOf(home, Colors.primary);
  const ac = colorsOf(away, Colors.white);

  return (
    <View style={{ gap: 16 }}>
      <View style={styles.formations}>
        <Text style={styles.formation}>{away?.formation ?? ''}</Text>
        <Meta>{m.a.n}</Meta>
      </View>
      <View style={[styles.pitch, { width: W, height: H }]}>
        <View style={styles.pitchHalfLine} />
        <View style={[styles.pitchCircle, { left: W / 2 - W * 0.14, top: H / 2 - W * 0.14, width: W * 0.28, height: W * 0.28, borderRadius: W * 0.14 }]} />
        <View style={[styles.pitchBox, { top: -1.5, left: W * 0.2, width: W * 0.6, height: H * 0.14 }]} />
        <View style={[styles.pitchBox, { bottom: -1.5, left: W * 0.2, width: W * 0.6, height: H * 0.14 }]} />
        <View style={[styles.pitchBox, { top: -1.5, left: W * 0.36, width: W * 0.28, height: H * 0.055 }]} />
        <View style={[styles.pitchBox, { bottom: -1.5, left: W * 0.36, width: W * 0.28, height: H * 0.055 }]} />
        {away && place(away).map(({ p, x, y }) => <PitchPlayer key={`a${p.id}`} p={p} x={x} y={y} {...ac} rating={m.ratings[p.id]} />)}
        {home && place(home).map(({ p, x, y }) => <PitchPlayer key={`h${p.id}`} p={p} x={x} y={y} {...hc} rating={m.ratings[p.id]} />)}
      </View>
      <View style={styles.formations}>
        <Text style={styles.formation}>{home?.formation ?? ''}</Text>
        <Meta>{m.h.n}</Meta>
      </View>

      <View style={styles.bench}>
        {[home, away].map((l, i) => l && (
          <View key={i} style={styles.benchCol}>
            <Meta color={Colors.primary}>{`${t.liveCoach}`}</Meta>
            <Text style={styles.benchCoach} numberOfLines={1}>{l.coach ?? '–'}</Text>
            <Meta color={Colors.primary} style={{ marginTop: 8 }}>{t.liveBench}</Meta>
            {l.subs.map((p) => {
              const rt = m.ratings[p.id];
              return (
                <View key={p.id} style={styles.benchRow}>
                  <Text style={styles.benchNo}>{p.no ?? ''}</Text>
                  <Text style={styles.benchName} numberOfLines={1}>{p.n}</Text>
                  {rt?.r != null && rt.min ? <Text style={[styles.benchRating, { color: ratingColor(rt.r) }]}>{rt.r.toFixed(1)}</Text> : null}
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Table ────────────────────────────────────────────────────────────────────
export function TableTab({ groups, m, loading }: { groups: TableRow[][] | null; m: MatchDetail; loading: boolean }) {
  const { t } = useI18n();
  if (loading) return <ActivityIndicator color={Colors.primary} style={{ marginTop: 30 }} />;
  const group = groups?.find((g) => g.some((r) => r.id === m.h.id || r.id === m.a.id)) ?? groups?.[0];
  if (!group?.length) return <View style={styles.emptyTab}><Text style={styles.emptyText}>{t.liveNoTable}</Text></View>;
  const anyLive = group.some((r) => r.live);
  return (
    <View>
      <View style={[styles.trow, styles.thead]}>
        <Text style={[styles.tcell, styles.trank]}>#</Text>
        <Text style={[styles.tcell, { flex: 1, textAlign: 'left' }]}>{anyLive ? t.liveTableLive.toUpperCase() : (group[0].group ?? '').toUpperCase()}</Text>
        <Text style={styles.tcell}>{t.liveColP}</Text>
        <Text style={styles.tcell}>{t.liveColGD}</Text>
        <Text style={[styles.tcell, styles.tpts]}>{t.liveColPts}</Text>
      </View>
      {group.map((r) => {
        const focus = r.id === m.h.id || r.id === m.a.id;
        const rank = r.liveRank ?? r.rank;
        const move = r.liveRank ? r.rank - r.liveRank : 0;
        return (
          <View key={r.id} style={[styles.trow, focus && styles.tfocus]}>
            <View style={styles.trank}>
              <Text style={[styles.trankText, focus && { color: Colors.primary }]}>{rank}</Text>
              {move !== 0 && <Text style={[styles.tmove, { color: move > 0 ? Colors.primary : Colors.live }]}>{move > 0 ? '▲' : '▼'}</Text>}
            </View>
            <View style={styles.tteam}>
              <Crest id={r.id} name={r.n} size={18} />
              <Text style={styles.tname} numberOfLines={1}>{r.n}</Text>
              {r.live && <View style={[styles.tlive, { backgroundColor: r.live.res === 'W' ? Colors.primary : r.live.res === 'D' ? Colors.white : Colors.live }]}><Text style={styles.tliveText}>{r.live.gf}:{r.live.ga}</Text></View>}
            </View>
            <Text style={styles.tcell}>{r.p + (r.live ? 1 : 0)}</Text>
            <Text style={styles.tcell}>{r.gd + (r.live?.gd ?? 0)}</Text>
            <Text style={[styles.tcell, styles.tpts, focus && { color: Colors.primary }]}>{r.pts + (r.live?.pts ?? 0)}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ── Head to head ─────────────────────────────────────────────────────────────
function resultFor(r: Row, teamId: number): 'W' | 'D' | 'L' | null {
  if (r.g[0] == null || r.g[1] == null) return null;
  const mine = r.h.id === teamId ? r.g[0] : r.g[1];
  const other = r.h.id === teamId ? r.g[1] : r.g[0];
  return mine > other ? 'W' : mine < other ? 'L' : 'D';
}

function FormStrip({ rows, teamId }: { rows: Row[]; teamId: number }) {
  return (
    <View style={styles.form}>
      {rows.map((r) => {
        const res = resultFor(r, teamId);
        return (
          <View key={r.id} style={[styles.formBox, { backgroundColor: res === 'W' ? Colors.primary : res === 'D' ? Colors.white : res === 'L' ? Colors.live : Colors.borderStrong }]}>
            <Text style={styles.formText}>{res ?? '–'}</Text>
          </View>
        );
      })}
    </View>
  );
}

export function H2HTab({ data, m, loading }: { data: H2H | null; m: MatchDetail; loading: boolean }) {
  const { t, lang } = useI18n();
  const tally = useMemo(() => {
    const out = { h: 0, d: 0, a: 0 };
    for (const r of data?.meetings ?? []) {
      const res = resultFor(r, m.h.id);
      if (res === 'W') out.h += 1; else if (res === 'L') out.a += 1; else if (res === 'D') out.d += 1;
    }
    return out;
  }, [data, m.h.id]);
  if (loading) return <ActivityIndicator color={Colors.primary} style={{ marginTop: 30 }} />;
  if (!data) return null;
  return (
    <View style={{ gap: 18 }}>
      <View style={{ gap: 10 }}>
        <Meta color={Colors.primary}>{t.liveForm}</Meta>
        {[m.h, m.a].map((team) => (
          <View key={team.id} style={styles.formRow}>
            <Crest id={team.id} name={team.n} size={22} />
            <Text style={styles.formName} numberOfLines={1}>{team.n.toUpperCase()}</Text>
            <FormStrip rows={[...(data.form[team.id] ?? [])].sort((x, y) => x.ts - y.ts)} teamId={team.id} />
          </View>
        ))}
      </View>
      <View style={{ gap: 10 }}>
        <Meta color={Colors.primary}>{t.liveLastMeetings}</Meta>
        {data.meetings.length ? (
          <>
            <View style={styles.tally}>
              {[[tally.h, m.h.n], [tally.d, 'X'], [tally.a, m.a.n]].map(([n, label], i) => (
                <View key={i} style={styles.tallyBox}>
                  <Text style={[styles.tallyNum, i === 1 && { color: Colors.textSecondary }]}>{n}</Text>
                  <Meta numberOfLines={1}>{String(label)}</Meta>
                </View>
              ))}
            </View>
            {data.meetings.map((r) => (
              <View key={r.id} style={styles.meet}>
                <Meta style={{ width: 74 }}>{new Date(r.ts * 1000).toLocaleDateString(lang, { day: '2-digit', month: '2-digit', year: '2-digit' })}</Meta>
                <Text style={styles.meetTeam} numberOfLines={1}>{r.h.n}</Text>
                <Text style={styles.meetScore}>{r.g[0] ?? '-'}:{r.g[1] ?? '-'}</Text>
                <Text style={[styles.meetTeam, { textAlign: 'right' }]} numberOfLines={1}>{r.a.n}</Text>
              </View>
            ))}
          </>
        ) : <Text style={styles.emptyText}>{t.liveNoH2H}</Text>}
      </View>
    </View>
  );
}

const pitchLine = withAlpha(Colors.primary, 0.28);

const styles = StyleSheet.create({
  board: { paddingHorizontal: 16, paddingTop: 8, gap: 14 },
  boardRow: { flexDirection: 'row', justifyContent: 'space-between' },
  boardTeam: { width: '33%', alignItems: 'center', gap: 8 },
  boardName: { color: Colors.white, fontSize: 17, lineHeight: 19, fontFamily: Fonts.label, textAlign: 'center' },
  boardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  boardCenter: { position: 'absolute', left: '30%', right: '30%', top: 4, alignItems: 'center', gap: 4 },
  boardScore: { color: Colors.white, fontSize: 64, lineHeight: 68, fontFamily: Fonts.display },
  scorers: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  scorerCol: { flex: 1, gap: 2 },
  scorer: { color: Colors.textSecondary, fontSize: 12, fontFamily: Fonts.medium },

  timeline: { height: 28, justifyContent: 'center', marginTop: 2 },
  timeTrack: { height: 4, backgroundColor: Colors.line, overflow: 'hidden' },
  timeFill: { height: 4, backgroundColor: Colors.primary },
  timeHalf: { position: 'absolute', top: 0, width: 2, height: 4, backgroundColor: Colors.black },
  mark: { position: 'absolute', width: 10, height: 10, borderWidth: 2, borderColor: Colors.black },
  markGoal: { backgroundColor: Colors.primary },
  markRed: { backgroundColor: Colors.live },

  take: { flexDirection: 'row', gap: 12, marginHorizontal: 16, padding: 12, backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.border, borderLeftWidth: 4, borderLeftColor: Colors.primary },
  takeAvatar: { width: 44, height: 44 },
  takeText: { color: Colors.white, fontSize: 15, lineHeight: 21, fontFamily: Fonts.medium },

  tipCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 8, gap: 10 },
  tipSide: { flex: 1, gap: 2 },
  tipScore: { color: Colors.black, fontSize: 28, lineHeight: 30, fontFamily: Fonts.display },
  tipMid: { alignItems: 'center', backgroundColor: Colors.black, paddingHorizontal: 10, paddingVertical: 4 },
  tipPts: { color: Colors.primary, fontSize: 24, lineHeight: 26, fontFamily: Fonts.display },

  emptyTab: { padding: 28, alignItems: 'center' },
  emptyText: { color: Colors.textSecondary, fontSize: 15, lineHeight: 22, fontFamily: Fonts.medium, textAlign: 'center' },

  ticker: { paddingVertical: 6 },
  tickerSpine: { position: 'absolute', left: '50%', marginLeft: -1, top: 0, bottom: 0, width: 2, backgroundColor: Colors.line },
  tickRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 6 },
  tickSide: { flex: 1 },
  tickMin: { width: 50, alignItems: 'center', justifyContent: 'center', paddingVertical: 4, backgroundColor: Colors.black, borderWidth: 1.5, borderColor: Colors.borderStrong, marginHorizontal: 6 },
  tickMinGoal: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tickMinText: { color: Colors.white, fontSize: 12, fontFamily: Fonts.monoBold },
  tickBody: { alignItems: 'flex-end', gap: 3, paddingVertical: 2 },
  tickGoal: {},
  tickHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tickType: { color: Colors.textMuted, fontSize: 10, fontFamily: Fonts.monoBold, letterSpacing: 0.8 },
  tickPlayer: { color: Colors.white, fontSize: 15, lineHeight: 19, fontFamily: Fonts.label },
  tickSub: { color: Colors.textSecondary, fontSize: 12, fontFamily: Fonts.medium },
  tickMark: { alignSelf: 'center', backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: 12, paddingVertical: 5, marginVertical: 8 },
  tickMarkText: { color: Colors.textSecondary, fontSize: 11, fontFamily: Fonts.monoBold, letterSpacing: 1 },
  iconGoal: { width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  iconGoalText: { fontSize: 13 },
  iconCard: { width: 10, height: 14 },
  iconSub: { color: Colors.primary, fontSize: 15, fontFamily: Fonts.bold },
  iconVar: { color: Colors.white, fontSize: 10, fontFamily: Fonts.monoBold },

  stats: { gap: 14 },
  statsHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stat: { gap: 6 },
  statLabels: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statVal: { color: Colors.white, fontSize: 20, lineHeight: 22, fontFamily: Fonts.display, minWidth: 48 },
  statName: { flex: 1, color: Colors.textSecondary, fontSize: 11, fontFamily: Fonts.monoBold, textAlign: 'center', letterSpacing: 0.6 },
  statBars: { flexDirection: 'row', gap: 4 },
  barTrack: { flex: 1, height: 6, backgroundColor: Colors.line },
  barFill: { height: 6 },

  formations: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  formation: { color: Colors.white, fontSize: 26, lineHeight: 28, fontFamily: Fonts.display },
  pitch: { alignSelf: 'center', backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: pitchLine, overflow: 'visible' },
  pitchHalfLine: { position: 'absolute', left: 0, right: 0, top: '50%', height: 1.5, backgroundColor: pitchLine },
  pitchCircle: { position: 'absolute', borderWidth: 1.5, borderColor: pitchLine },
  pitchBox: { position: 'absolute', borderWidth: 1.5, borderColor: pitchLine },
  pp: { position: 'absolute', width: 68, alignItems: 'center', gap: 3 },
  ppShirt: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.black },
  ppNo: { fontSize: 13, fontFamily: Fonts.monoBold },
  ppRating: { position: 'absolute', right: -14, top: -8, paddingHorizontal: 3, paddingVertical: 1 },
  ppRatingText: { color: Colors.black, fontSize: 9, fontFamily: Fonts.monoBold },
  ppGoal: { position: 'absolute', left: -12, bottom: -4, fontSize: 9 },
  ppRed: { position: 'absolute', left: -6, top: -6, width: 7, height: 10, backgroundColor: Colors.live },
  ppName: { color: Colors.white, fontSize: 10, fontFamily: Fonts.semibold, textAlign: 'center', maxWidth: 68 },

  bench: { flexDirection: 'row', gap: 16 },
  benchCol: { flex: 1, gap: 4 },
  benchCoach: { color: Colors.white, fontSize: 15, fontFamily: Fonts.label },
  benchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: Colors.line },
  benchNo: { color: Colors.textMuted, fontSize: 12, fontFamily: Fonts.monoBold, width: 20 },
  benchName: { flex: 1, color: Colors.white, fontSize: 13, fontFamily: Fonts.medium },
  benchRating: { fontSize: 11, fontFamily: Fonts.monoBold },

  trow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: Colors.line, gap: 6 },
  thead: { borderBottomColor: Colors.borderStrong },
  tfocus: { backgroundColor: Colors.card, borderLeftWidth: 3, borderLeftColor: Colors.primary },
  tcell: { width: 32, color: Colors.textSecondary, fontSize: 12, fontFamily: Fonts.monoBold, textAlign: 'center' },
  trank: { width: 34, flexDirection: 'row', alignItems: 'center', gap: 2 },
  trankText: { color: Colors.white, fontSize: 13, fontFamily: Fonts.monoBold },
  tmove: { fontSize: 9 },
  tteam: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  tname: { flexShrink: 1, color: Colors.white, fontSize: 14, fontFamily: Fonts.label },
  tlive: { paddingHorizontal: 4, paddingVertical: 1 },
  tliveText: { color: Colors.black, fontSize: 10, fontFamily: Fonts.monoBold },
  tpts: { color: Colors.white, fontFamily: Fonts.display, fontSize: 16 },

  form: { flexDirection: 'row', gap: 4 },
  formBox: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  formText: { color: Colors.black, fontSize: 11, fontFamily: Fonts.monoBold },
  formRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  formName: { flex: 1, color: Colors.white, fontSize: 15, fontFamily: Fonts.label },
  tally: { flexDirection: 'row', gap: 8 },
  tallyBox: { flex: 1, backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.border, padding: 10, alignItems: 'center', gap: 2 },
  tallyNum: { color: Colors.primary, fontSize: 34, lineHeight: 38, fontFamily: Fonts.display },
  meet: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.line },
  meetTeam: { flex: 1, color: Colors.white, fontSize: 13, fontFamily: Fonts.label },
  meetScore: { color: Colors.white, fontSize: 18, fontFamily: Fonts.display, width: 46, textAlign: 'center' },
});

