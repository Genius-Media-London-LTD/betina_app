import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn } from 'react-native-reanimated';
import BackButton from '../../src/components/BackButton';
import ScreenBg from '../../src/components/ScreenBg';
import { Meta } from '../../src/components/Urban';
import { LeagueLogo, Star } from '../../src/components/live/LiveParts';
import { H2HTab, LineupsTab, Scoreboard, StatsTab, TableTab, TakeCard, TickerTab, TipCard } from '../../src/components/live/MatchParts';
import { useI18n } from '../../src/lib/i18n';
import {
  H2H, MatchDetail, TableRow, fetchH2H, fetchMatch, fetchTable, fetchTake, isFinished, isLive, useLiveNow,
} from '../../src/lib/live';
import { tipFor, useTips } from '../../src/lib/liveTips';
import { Colors, Fonts } from '../../src/theme';

type Tab = 'ticker' | 'stats' | 'lineups' | 'table' | 'h2h';

/** BETina Live match page: /match/<API-Football fixture id>. */
export default function MatchPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const fixture = Number(id);
  const { t, lang } = useI18n();
  const insets = useSafeAreaInsets();
  const [m, setM] = useState<MatchDetail | null>(null);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<Tab>('ticker');
  const [take, setTake] = useState<string | null>(null);
  const [takeLoading, setTakeLoading] = useState(true);
  const [table, setTable] = useState<TableRow[][] | null>(null);
  const [tableLoading, setTableLoading] = useState(false);
  const [h2h, setH2h] = useState<H2H | null>(null);
  const [h2hLoading, setH2hLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const now = useLiveNow(15_000);

  const load = useCallback(async () => {
    try {
      setM(await fetchMatch(fixture));
      setError(false);
    } catch {
      setError(true);
    }
  }, [fixture]);

  useEffect(() => { load(); }, [load]);

  // Live: refresh the details (ticker, stats) every 15 s.
  const live = !!m && isLive(m.st);
  useEffect(() => {
    if (!live) return;
    const timer = setInterval(load, 15_000);
    return () => clearInterval(timer);
  }, [live, load]);

  // The shared poll can be a few seconds fresher for score and minute.
  const fresh = now?.matches.find((x) => x.id === fixture);
  const match = useMemo(() => (m && fresh ? { ...m, st: fresh.st, min: fresh.min, ex: fresh.ex, g: fresh.g, red: fresh.red ?? m.red } : m), [m, fresh]);

  // BETina's take: new one for each new score / phase.
  const takeKey = match ? `${match.st === 'HT' ? 'ht' : isLive(match.st) ? 'live' : isFinished(match.st) ? 'ft' : 'pre'}:${match.g.join('-')}` : '';
  const lastTake = useRef('');
  useEffect(() => {
    if (!takeKey || takeKey === lastTake.current) return;
    lastTake.current = takeKey;
    setTakeLoading(true);
    fetchTake(fixture, lang).then(setTake).catch(() => {}).finally(() => setTakeLoading(false));
  }, [takeKey, fixture, lang]);

  const TABS: [Tab, string][] = [['ticker', t.liveTabTicker], ['stats', t.liveTabStats], ['lineups', t.liveTabLineups], ['table', t.liveTabTable], ['h2h', t.liveTabH2H]];
  // Finished matches only show the tabs the data covers (small leagues often have no details).
  const done = !!match && isFinished(match.st);
  const tabs = TABS.filter(([k]) => !done || !match || (k === 'ticker' ? match.events.length > 0 : k === 'stats' ? match.stats.length > 0 : k === 'lineups' ? match.lineups.length > 0 : true));
  const current: Tab = tabs.some(([k]) => k === tab) ? tab : tabs[0][0];
  const noDetail = done && !!match && !match.events.length && !match.stats.length && !match.lineups.length;

  // Lazy tabs.
  useEffect(() => {
    if (!m || current !== 'table' || (table && !live)) return;
    setTableLoading(!table);
    fetchTable(m.league.id, m.league.season).then(setTable).catch(() => setTable([])).finally(() => setTableLoading(false));
  }, [current, m?.league.id, live]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!m || current !== 'h2h' || h2h) return;
    setH2hLoading(true);
    fetchH2H(m.h.id, m.a.id).then(setH2h).catch(() => {}).finally(() => setH2hLoading(false));
  }, [current, m?.h.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const [from, to] = useMemo(() => (m ? [m.ts * 1000 - 3_600_000, m.ts * 1000 + 3_600_000] : [0, 0]), [m?.ts]); // eslint-disable-line react-hooks/exhaustive-deps
  const tips = useTips(from, to);
  const tip = match ? tipFor(match, tips) : undefined;


  return (
    <ScreenBg>
      <View style={[styles.top, { paddingTop: insets.top + 10 }]}>
        <BackButton />
        {match && (
          <View style={styles.topLeague}>
            <LeagueLogo id={match.league.id} size={16} />
            <View style={{ flex: 1 }}>
              <Meta numberOfLines={1}>{match.league.country}</Meta>
              <Text style={styles.topName} numberOfLines={1}>{`${match.league.name} · ${match.league.round}`.toUpperCase()}</Text>
            </View>
          </View>
        )}
        {match && <Star kind="match" refId={match.id} label={`${match.h.n} – ${match.a.n}`} size={24} />}
      </View>

      {!match ? (
        <View style={styles.center}>
          {error ? (
            <>
              <Text style={styles.errorText}>{t.liveError}</Text>
              <Pressable onPress={load} style={styles.retry}><Text style={styles.retryText}>{t.liveRetry.toUpperCase()}</Text></Pressable>
            </>
          ) : <ActivityIndicator color={Colors.primary} />}
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + 40, gap: 14 }}
          stickyHeaderIndices={[3]}
          refreshControl={<RefreshControl refreshing={refreshing} tintColor={Colors.primary} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
        >
          <Animated.View entering={FadeIn.duration(350)}><Scoreboard m={match} /></Animated.View>
          <TakeCard text={take} loading={takeLoading} />
          {tip?.mine ? <TipCard tip={tip} g={match.g} live={isLive(match.st)} /> : <View />}

          <View style={styles.tabsWrap}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
              {tabs.map(([key, label]) => {
                const on = key === current;
                return (
                  <Pressable key={key} onPress={() => { Haptics.selectionAsync(); setTab(key); }} style={[styles.tab, on && styles.tabOn]}>
                    <Text style={[styles.tabText, on && { color: Colors.white }]}>{label.toUpperCase()}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.body}>
            {noDetail && <Text style={styles.note}>{t.liveNoCoverage}</Text>}
            {current === 'ticker' && <TickerTab m={match} />}
            {current === 'stats' && <StatsTab m={match} />}
            {current === 'lineups' && <LineupsTab m={match} />}
            {current === 'table' && <TableTab groups={table} m={match} loading={tableLoading} />}
            {current === 'h2h' && <H2HTab data={h2h} m={match} loading={h2hLoading} />}
          </View>

          {(match.venue || match.referee) && (
            <View style={styles.facts}>
              {match.venue && <Meta>{`📍 ${match.venue}`}</Meta>}
              {match.referee && <Meta>{`${t.liveReferee}: ${match.referee}`}</Meta>}
            </View>
          )}
        </ScrollView>
      )}
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 10 },
  topLeague: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  topName: { color: Colors.white, fontSize: 13, fontFamily: Fonts.label, letterSpacing: 0.4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 32 },
  errorText: { color: Colors.textSecondary, fontSize: 15, fontFamily: Fonts.medium, textAlign: 'center' },
  retry: { backgroundColor: Colors.primary, paddingHorizontal: 18, paddingVertical: 10 },
  retryText: { color: Colors.black, fontSize: 16, fontFamily: Fonts.label },
  tabsWrap: { backgroundColor: Colors.black, borderBottomWidth: 1.5, borderBottomColor: Colors.border },
  tabs: { paddingHorizontal: 12 },
  tab: { paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 3, borderBottomColor: Colors.black },
  tabOn: { borderBottomColor: Colors.primary },
  tabText: { color: Colors.textMuted, fontSize: 16, fontFamily: Fonts.label, letterSpacing: 0.5 },
  body: { paddingHorizontal: 16, minHeight: 300 },
  facts: { paddingHorizontal: 16, gap: 4 },
  note: { color: Colors.textSecondary, fontSize: 14, lineHeight: 20, fontFamily: Fonts.medium, marginBottom: 14 },
});
