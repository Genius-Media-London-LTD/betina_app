// BETina Live — the live scores centre (urban design 2026-10). Big LIVE head
// with the running goal ticker, a day strip, All / Live / Mine, the player's
// own matches up top, a carousel of the biggest live games and every league
// of the day below (top leagues open, the rest folded). The live poll
// (lib/live.ts) refreshes scores every 15 s while this page is on screen.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import HScroll from '../components/HScroll';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import ScreenBg from '../components/ScreenBg';
import { Blink, Meta, Ticker } from '../components/Urban';
import { Crest, LeagueHeader, LiveCard, LiveMinute, MatchRow, RedCards, Star, useStatusLabel } from '../components/live/LiveParts';
import { useChrome } from '../components/chrome';
import { useProfile } from '../hooks/useProfile';
import { isFollowing, useFollows } from '../lib/follows';
import { useI18n } from '../lib/i18n';
import { DayData, League, Row, fetchDay, isLive, localDay, sameTeam, useLiveNow } from '../lib/live';
import { tipFor, tipPoints, useTips } from '../lib/liveTips';
import { Colors, Fonts, displayType } from '../theme';

type Filter = 'all' | 'live' | 'mine';
type Item =
  | { kind: 'league'; league: League; count: number; live: number; open: boolean }
  | { kind: 'match'; r: Row; last: boolean };

const DAYS = [-3, -2, -1, 0, 1, 2, 3, 4];
const OPEN_BY_DEFAULT = 12;

export default function LiveScreen() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const chrome = useChrome();
  const visible = chrome.page === 'scores';
  const { profile } = useProfile();
  useFollows();

  const [offset, setOffset] = useState(0);
  const [filter, setFilter] = useState<Filter>('all');
  const [day, setDay] = useState<DayData | null>(null);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [toggled, setToggled] = useState<Record<number, boolean>>({});
  const now = useLiveNow(visible ? 15_000 : 60_000);

  const date = localDay(offset);
  const load = useCallback(async () => {
    try {
      const d = await fetchDay(date);
      setDay(d);
      setError(false);
    } catch {
      setError(true);
    }
  }, [date]);

  useEffect(() => { setDay(null); setError(false); setToggled({}); load(); }, [load]);
  // Today's list (new kick-offs, finals) refreshes every minute while visible.
  useEffect(() => {
    if (!visible || offset !== 0) return;
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [visible, offset, load]);

  // Day window for the Tippspiel pairing.
  const [from, to] = useMemo(() => {
    const d = new Date(`${date}T00:00:00`);
    return [d.getTime(), d.getTime() + 86_400_000];
  }, [date]);
  const tips = useTips(from, to);

  const fav = profile?.favourite_team ?? null;
  const isMine = useCallback((r: Row) => sameTeam(fav, r.h.n) || sameTeam(fav, r.a.n)
    || isFollowing('team', r.h.id) || isFollowing('team', r.a.id) || isFollowing('match', r.id) || isFollowing('league', r.lg), [fav]);

  // The day's leagues with the fresher live poll merged in.
  const leagues = useMemo(() => {
    if (!day) return [];
    const liveBy = new Map((now?.matches ?? []).map((m) => [m.id, m]));
    return day.leagues.map((g) => ({ league: g.league, matches: g.matches.map((m) => (liveBy.has(m.id) ? { ...m, ...liveBy.get(m.id)! } : m)) }));
  }, [day, now]);

  const all = useMemo(() => leagues.flatMap((g) => g.matches.map((r) => ({ r, league: g.league }))), [leagues]);
  const liveCount = all.filter(({ r }) => isLive(r.st)).length;
  const mine = all.filter(({ r }) => isMine(r)).sort((a, b) => Number(isLive(b.r.st)) - Number(isLive(a.r.st)) || a.r.ts - b.r.ts);
  const topLive = all.filter(({ r }) => isLive(r.st)).slice(0, 10);
  const serverNow = now?.serverNow ?? day?.serverNow ?? Date.now();

  // Goal ticker: the latest goals of the live matches.
  const tickerItems = useMemo(() => all
    .filter(({ r }) => isLive(r.st) && r.sc?.length)
    .sort((a, b) => (b.r.goalAt ?? 0) - (a.r.goalAt ?? 0))
    .slice(0, 12)
    .map(({ r }) => {
      const g = r.sc![r.sc!.length - 1];
      return `${g.p} ${g.m ?? ''}' · ${r.h.n} ${r.g[0]}:${r.g[1]} ${r.a.n}`;
    }), [all]);

  const items = useMemo<Item[]>(() => {
    const out: Item[] = [];
    leagues.forEach((g, i) => {
      const matches = g.matches.filter((r) => (filter === 'live' ? isLive(r.st) : filter === 'mine' ? isMine(r) : true));
      if (!matches.length) return;
      const live = matches.filter((r) => isLive(r.st)).length;
      const auto = filter !== 'all' || i < OPEN_BY_DEFAULT || live > 0 || matches.some(isMine);
      const open = toggled[g.league.id] ?? auto;
      out.push({ kind: 'league', league: g.league, count: matches.length, live, open });
      if (open) matches.forEach((r, k) => out.push({ kind: 'match', r, last: k === matches.length - 1 }));
    });
    return out;
  }, [leagues, filter, toggled, isMine]);

  const openMatch = (id: number) => { Haptics.selectionAsync(); router.push({ pathname: '/match/[id]', params: { id: String(id) } }); };
  const dayLabel = (o: number) => {
    if (o === 0) return t.homeToday;
    if (o === -1) return t.liveYesterday;
    if (o === 1) return t.homeTomorrow;
    const d = new Date();
    d.setDate(d.getDate() + o);
    return d.toLocaleDateString(lang, { weekday: 'short' }).replace('.', '');
  };
  const dayNum = (o: number) => { const d = new Date(); d.setDate(d.getDate() + o); return String(d.getDate()); };

  const header = (
    <View>
      {/* LIVE head */}
      <Animated.View entering={FadeInDown.duration(450)} style={styles.head}>
        <View style={{ flex: 1 }}>
          <Meta color={Colors.primary}>{t.liveCenter}</Meta>
          <Text style={styles.title}>LIVE<Text style={{ color: Colors.live }}>.</Text></Text>
        </View>
        <View style={styles.counter}>
          <View style={styles.counterRow}>
            <Blink size={9} />
            <Text style={styles.counterNum}>{liveCount}</Text>
          </View>
          <Meta color={Colors.white}>{t.liveNowCount.replace('{n}', '').trim() || 'LIVE'}</Meta>
        </View>
      </Animated.View>

      {tickerItems.length > 0 && <Ticker label={t.liveEvGoal} items={tickerItems} speed={40} />}

      {/* Days */}
      <HScroll contentContainerStyle={styles.days}>
        {DAYS.map((o) => {
          const on = o === offset;
          return (
            <Pressable key={o} onPress={() => { Haptics.selectionAsync(); setOffset(o); }} style={[styles.day, on && styles.dayOn]}>
              <Text style={[styles.dayLabel, on && { color: Colors.black }]} numberOfLines={1}>{dayLabel(o).toUpperCase()}</Text>
              <Text style={[styles.dayNum, on && { color: Colors.black }]}>{dayNum(o)}</Text>
            </Pressable>
          );
        })}
      </HScroll>

      {/* Filter */}
      <View style={styles.filters}>
        {(['all', 'live', 'mine'] as Filter[]).map((f) => {
          const on = f === filter;
          const label = f === 'all' ? t.liveAll : f === 'live' ? `${t.liveOnlyLive} · ${liveCount}` : `${t.liveMine} · ${mine.length}`;
          return (
            <Pressable key={f} onPress={() => { Haptics.selectionAsync(); setFilter(f); }} style={[styles.filter, on && styles.filterOn]}>
              {f === 'live' && liveCount > 0 && <Blink size={6} color={on ? Colors.black : Colors.live} />}
              <Text style={[styles.filterText, on && { color: Colors.black }]}>{label.toUpperCase()}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* For you */}
      {filter === 'all' && mine.length > 0 && (
        <Animated.View entering={FadeIn.duration(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>{t.liveForYou.toUpperCase()}</Text>
          {mine.slice(0, 3).map(({ r, league }) => (
            <Spotlight key={r.id} r={r} league={league} tip={tipFor(r, tips)} onPress={() => openMatch(r.id)} />
          ))}
        </Animated.View>
      )}

      {/* Live now carousel */}
      {filter === 'all' && offset === 0 && topLive.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Blink size={7} />
            <Text style={styles.sectionTitle}>{t.liveTop.toUpperCase()}</Text>
          </View>
          <HScroll contentContainerStyle={styles.carousel}>
            {topLive.map(({ r, league }) => (
              <LiveCard key={r.id} r={r} league={league.name} serverNow={serverNow} onPress={() => openMatch(r.id)} />
            ))}
          </HScroll>
        </View>
      )}
      <View style={{ height: 14 }} />
    </View>
  );

  const empty = !day && !error
    ? <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
    : (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>
          {error ? t.liveError : filter === 'live' ? t.liveEmptyLive : filter === 'mine' ? t.liveEmptyMine : t.liveEmpty}
        </Text>
        {error && (
          <Pressable onPress={load} style={styles.retry}><Text style={styles.retryText}>{t.liveRetry.toUpperCase()}</Text></Pressable>
        )}
      </View>
    );

  return (
    <ScreenBg>
      <FlatList
        data={items}
        keyExtractor={(it) => (it.kind === 'league' ? `l${it.league.id}` : `m${it.r.id}`)}
        renderItem={({ item }) => item.kind === 'league'
          ? (
            <LeagueHeader
              id={item.league.id} name={item.league.name} country={item.league.country} count={item.count} live={item.live} open={item.open}
              onToggle={() => { Haptics.selectionAsync(); setToggled((s) => ({ ...s, [item.league.id]: !item.open })); }}
            />
          )
          : <MatchRow r={item.r} serverNow={serverNow} tip={tipFor(item.r, tips)} onPress={() => openMatch(item.r.id)} last={item.last} />}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        contentContainerStyle={{ paddingTop: chrome.top + 8, paddingBottom: chrome.bottom + 40 }}
        initialNumToRender={30}
        windowSize={11}
        refreshControl={<RefreshControl refreshing={refreshing} tintColor={Colors.primary} progressViewOffset={chrome.top} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
      />
    </ScreenBg>
  );
}

/** Big card for the player's own matches (favourite / followed). */
function Spotlight({ r, league, tip, onPress }: { r: Row; league: League; tip?: ReturnType<typeof tipFor>; onPress: () => void }) {
  const { t } = useI18n();
  const status = useStatusLabel(r);
  const started = r.g[0] != null;
  const pts = tip ? tipPoints(tip.mine, r.g) : null;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.spot, status.live && styles.spotLive, pressed && { opacity: 0.9 }]}>
      <View style={styles.spotTop}>
        <Meta numberOfLines={1} style={{ flex: 1 }}>{`${league.country} · ${league.name}`}</Meta>
        {status.live ? <LiveMinute text={status.text} size={14} /> : <Meta color={Colors.primary}>{status.text}</Meta>}
        <Star kind="match" refId={r.id} label={`${r.h.n} – ${r.a.n}`} size={18} />
      </View>
      <View style={styles.spotBody}>
        {[r.h, r.a].map((team, s) => (
          <View key={s} style={[styles.spotTeam, s === 1 && { alignItems: 'flex-end' }]}>
            <Crest id={team.id} name={team.n} size={46} />
            <View style={styles.spotNameRow}>
              <Text style={styles.spotName} numberOfLines={2}>{team.n.toUpperCase()}</Text>
              <RedCards n={r.red?.[s] ?? 0} />
            </View>
          </View>
        ))}
        <View style={styles.spotScoreBox} pointerEvents="none">
          <Text style={[styles.spotScore, status.live && { color: Colors.primary }]}>{started ? `${r.g[0]}:${r.g[1]}` : 'VS'}</Text>
        </View>
      </View>
      {!!r.sc?.length && (
        <Text style={styles.spotScorers} numberOfLines={2}>{r.sc.map((g) => `⚽ ${g.p} ${g.m ?? ''}'`).join('   ')}</Text>
      )}
      {tip?.mine && (
        <View style={styles.spotTip}>
          <Meta color={Colors.black}>{`${t.liveYourTip} ${tip.mine.join(':')}`}</Meta>
          {pts != null && <Meta color={Colors.black}>{pts > 0 ? t.livePtsNow.replace('{n}', String(pts)) : t.livePtsZero}</Meta>}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 16, paddingBottom: 12 },
  title: { ...displayType(96, 96), color: Colors.white },
  counter: { alignItems: 'flex-end', paddingBottom: 12 },
  counterRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  counterNum: { ...displayType(48, 52), color: Colors.white },

  days: { gap: 6, paddingHorizontal: 16, paddingTop: 14 },
  day: { minWidth: 76, paddingVertical: 8, paddingHorizontal: 8, borderWidth: 1.5, borderColor: Colors.borderStrong, alignItems: 'center', gap: 2 },
  dayOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dayLabel: { color: Colors.textSecondary, fontSize: 10, fontFamily: Fonts.monoBold, letterSpacing: 0.2 },
  dayNum: { ...displayType(24, 28), color: Colors.white },

  filters: { flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingTop: 10 },
  filter: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1.5, borderColor: Colors.borderStrong },
  filterOn: { backgroundColor: Colors.white, borderColor: Colors.white },
  filterText: { color: Colors.white, fontSize: 14, fontFamily: Fonts.label, letterSpacing: 0.5 },

  section: { paddingTop: 18, gap: 10 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16 },
  sectionTitle: { ...displayType(28, 30), color: Colors.white, paddingHorizontal: 16 },
  carousel: { gap: 8, paddingHorizontal: 16 },

  spot: { marginHorizontal: 16, padding: 14, gap: 12, backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.border },
  spotLive: { borderColor: Colors.primary },
  spotTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  spotBody: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  spotTeam: { width: '34%', gap: 8 },
  spotNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  spotName: { color: Colors.white, fontSize: 16, lineHeight: 18, fontFamily: Fonts.label, flexShrink: 1 },
  spotScoreBox: { position: 'absolute', left: 0, right: 0, top: 4, alignItems: 'center' },
  spotScore: { ...displayType(50, 54), color: Colors.white },
  spotScorers: { color: Colors.textSecondary, fontSize: 12, lineHeight: 17, fontFamily: Fonts.medium },
  spotTip: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: Colors.primary, paddingHorizontal: 10, paddingVertical: 6 },

  empty: { padding: 32, alignItems: 'center', gap: 14 },
  emptyText: { color: Colors.textSecondary, fontSize: 15, lineHeight: 22, fontFamily: Fonts.medium, textAlign: 'center' },
  retry: { backgroundColor: Colors.primary, paddingHorizontal: 18, paddingVertical: 10 },
  retryText: { color: Colors.black, fontSize: 16, fontFamily: Fonts.label },
});
