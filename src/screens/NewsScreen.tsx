import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import ScreenBg from '../components/ScreenBg';
import { Headline, Meta, OutlineNumber, Sticker, Ticker } from '../components/Urban';
import { useProfile } from '../hooks/useProfile';
import { SPORT_KEYS, useI18n } from '../lib/i18n';
import { fetchNewsFeed, NewsCard, PAGE_SIZE, timeAgo } from '../lib/news';
import { useChrome } from '../components/chrome';
import { Colors, Fonts, Typography, withAlpha } from '../theme';

const API = 'https://intelligence.geniusbet.com';

// Sport filters, in the order shown; the player's interests come first.
const ALL_SPORT_TABS = ['sport', 'football', 'tennis', 'basketball', 'nfl', 'mma', 'cricket', 'rugby', 'golf', 'athletics'];

type MatchEvent = { id: string; name: string; home: string; away: string; homeScore: string | null; awayScore: string | null; date: string; time: string; league: string };

function formatMatchDate(dateStr: string, timeStr: string, locale: string) {
  const d = new Date(`${dateStr}T${timeStr || '00:00:00'}`);
  return d.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' }) +
    (timeStr ? ' · ' + timeStr.slice(0, 5) : '');
}

/** Lead story = most important of the newest stories; Top 5 = the next most important. */
function splitFirstPage(page: NewsCard[]) {
  const byWeight = (a: NewsCard, b: NewsCard) =>
    (b.importance ?? 0) - (a.importance ?? 0) || Date.parse(b.published_at) - Date.parse(a.published_at);
  const lead = [...page.slice(0, 8)].sort(byWeight)[0] ?? null;
  const top = page.filter((c) => c.id !== lead?.id && c.image).sort(byWeight).slice(0, 5);
  const used = new Set([lead?.id, ...top.map((c) => c.id)]);
  return { lead, top, rest: page.filter((c) => !used.has(c.id)) };
}

export default function NewsScreen() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const chrome = useChrome();
  const { profile } = useProfile();
  const [sport, setSport] = useState('sport');
  const [cards, setCards] = useState<NewsCard[]>([]);
  const [lastRaw, setLastRaw] = useState<NewsCard | null>(null);
  const [teamNews, setTeamNews] = useState<NewsCard[]>([]);
  const [nextEvents, setNextEvents] = useState<MatchEvent[]>([]);
  const [lastEvents, setLastEvents] = useState<MatchEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const request = useRef(0);

  const teamId = profile?.favourite_team_id ?? null;
  const teamName = profile?.favourite_team ?? null;

  // Sport chips: "all" first, then the player's sports, then the rest.
  const tabs = useMemo(() => {
    const mine = (profile?.favourite_sports ?? '').split(',').filter((s) => s !== 'sport' && ALL_SPORT_TABS.includes(s));
    return ['sport', ...mine, ...ALL_SPORT_TABS.filter((s) => s !== 'sport' && !mine.includes(s))];
  }, [profile?.favourite_sports]);

  const loadFirst = useCallback(async () => {
    const id = ++request.current;
    setLoading(true);
    setFailed(false);
    try {
      const page = await fetchNewsFeed({ lang, sport });
      if (id !== request.current) return;
      setCards(page);
      setLastRaw(page[page.length - 1] ?? null);
      setDone(page.length < PAGE_SIZE);
    } catch {
      if (id === request.current) { setCards([]); setFailed(true); }
    } finally {
      if (id === request.current) setLoading(false);
    }
  }, [lang, sport]);

  const loadMore = async () => {
    if (loading || loadingMore || done || !lastRaw) return;
    const id = request.current;
    setLoadingMore(true);
    try {
      const page = await fetchNewsFeed({ lang, sport, after: lastRaw });
      if (id !== request.current) return;
      setCards((prev) => [...prev, ...page.filter((c) => !prev.some((p) => p.id === c.id))]);
      setLastRaw(page[page.length - 1] ?? lastRaw);
      setDone(page.length < PAGE_SIZE);
    } catch {
      // keep what we have; the next scroll retries
    } finally {
      setLoadingMore(false);
    }
  };

  const loadTeam = useCallback(async () => {
    if (teamName) fetchNewsFeed({ lang, team: teamName, limit: 8 }).then(setTeamNews).catch(() => setTeamNews([]));
    if (!teamId) return;
    try {
      const [nextR, lastR] = await Promise.all([
        fetch(`${API}/api/sports/team/${teamId}/next`),
        fetch(`${API}/api/sports/team/${teamId}/last`),
      ]);
      setNextEvents((await nextR.json()).events ?? []);
      setLastEvents((await lastR.json()).events ?? []);
    } catch {
      // team block just stays empty
    }
  }, [lang, teamId, teamName]);

  useEffect(() => { loadFirst(); }, [loadFirst]);
  useEffect(() => { loadTeam(); }, [loadTeam]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadFirst(), loadTeam()]);
    setRefreshing(false);
  };

  const open = (card: NewsCard) => {
    Haptics.selectionAsync();
    router.push({ pathname: '/article', params: { id: String(card.id) } });
  };

  // The first page is split into lead + Top 5; everything after streams below.
  const { lead, top, rest } = useMemo(() => {
    const first = splitFirstPage(cards.slice(0, PAGE_SIZE));
    return { ...first, rest: [...first.rest, ...cards.slice(PAGE_SIZE)] };
  }, [cards]);

  const nextMatch = nextEvents[0];
  const sportLabel = (id: string) => (SPORT_KEYS[id] ? String(t[SPORT_KEYS[id]]) : id).toUpperCase();

  const header = (
    <View>
      {cards.length > 0 && <Ticker label={t.newsBreaking} items={cards.slice(0, 8).map((n) => n.headline)} />}

      {/* Sport filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {tabs.map((id) => {
          const on = sport === id;
          return (
            <Pressable
              key={id}
              onPress={() => { Haptics.selectionAsync(); setSport(id); }}
              style={({ pressed }) => [styles.chip, on && styles.chipOn, pressed && !on && styles.chipPressed]}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{id === 'sport' ? t.newsAll.toUpperCase() : sportLabel(id)}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {loading && cards.length === 0 ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 60 }} />
      ) : !lead ? (
        <View style={styles.empty}>
          <Headline text={failed ? t.articleError : t.liveNoNews} size={34} accent="none" />
        </View>
      ) : (
        <>
          {/* Lead story */}
          <Animated.View entering={FadeIn.duration(400)}>
            <Pressable onPress={() => open(lead)} style={styles.hero}>
              {lead.image ? (
                <Image source={{ uri: lead.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              ) : (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.card }]} />
              )}
              <LinearGradient
                colors={[withAlpha(Colors.black, 0), withAlpha(Colors.black, 0.88), Colors.black]}
                locations={[0.25, 0.68, 1]}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
              <Sticker text={t.newsTopStory} style={styles.heroSticker} />
              <View style={styles.heroText}>
                <Meta color={Colors.primary} size={11}>{lead.kicker}</Meta>
                <Headline text={lead.headline} size={42} accent="first" numberOfLines={5} />
                <Text style={styles.heroTeaser} numberOfLines={3}>{lead.teaser}</Text>
                <Meta>{`BETINA NEWS · ${timeAgo(lead.published_at, t)}`}</Meta>
              </View>
            </Pressable>
          </Animated.View>

          {/* Your team */}
          {teamName && (nextMatch || lastEvents.length > 0 || teamNews.length > 0) && (
            <Animated.View entering={FadeInDown.delay(80).duration(400)}>
              <View style={styles.sectionHead}>
                <Headline text={teamName} size={30} accent="last" numberOfLines={1} />
              </View>
              {nextMatch && (
                <View style={styles.matchCard}>
                  <Meta color={Colors.black} style={{ fontFamily: Fonts.monoBold }}>{`${t.liveUpcoming} · ${nextMatch.league}`}</Meta>
                  <Text style={styles.matchTeams} numberOfLines={2}>
                    {nextMatch.home.toUpperCase()} <Text style={styles.matchVs}>VS</Text> {nextMatch.away.toUpperCase()}
                  </Text>
                  <Meta color={Colors.black} style={{ fontFamily: Fonts.monoBold }}>
                    {formatMatchDate(nextMatch.date, nextMatch.time, lang)}
                  </Meta>
                </View>
              )}
              {lastEvents.slice(0, 3).map((e) => (
                <View key={e.id} style={styles.resultRow}>
                  <Text style={styles.resultTeam} numberOfLines={1}>{e.home.toUpperCase()}</Text>
                  <Text style={styles.resultScore}>{e.homeScore ?? '–'}:{e.awayScore ?? '–'}</Text>
                  <Text style={[styles.resultTeam, { textAlign: 'right' }]} numberOfLines={1}>{e.away.toUpperCase()}</Text>
                </View>
              ))}
              {teamNews.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.teamNews}>
                  {teamNews.map((c) => (
                    <Pressable key={c.id} onPress={() => open(c)} style={({ pressed }) => [styles.teamCard, pressed && styles.pressed]}>
                      {c.image ? <Image source={{ uri: c.image }} style={styles.teamImage} resizeMode="cover" /> : <View style={[styles.teamImage, { backgroundColor: Colors.card }]} />}
                      <View style={styles.teamCardText}>
                        <Meta color={Colors.primary}>{c.kicker}</Meta>
                        <Text style={styles.teamCardTitle} numberOfLines={3}>{c.headline.toUpperCase()}</Text>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </Animated.View>
          )}

          {/* Top 5 */}
          {top.length > 0 && (
            <>
              <View style={styles.sectionHead}>
                <Headline text={t.newsTop5} size={34} accent="last" />
              </View>
              <View style={styles.list}>
                {top.map((c, i) => (
                  <Pressable key={c.id} onPress={() => open(c)} style={({ pressed }) => [styles.topRow, pressed && styles.pressed]}>
                    <View style={styles.topNum}><OutlineNumber value={String(i + 1).padStart(2, '0')} size={44} /></View>
                    <View style={styles.rowBody}>
                      <Meta color={Colors.primary}>{c.kicker}</Meta>
                      <Text style={styles.rowTitle} numberOfLines={3}>{c.headline.toUpperCase()}</Text>
                      <Meta>{timeAgo(c.published_at, t)}</Meta>
                    </View>
                    {c.image && <Image source={{ uri: c.image }} style={styles.thumb} resizeMode="cover" />}
                  </Pressable>
                ))}
              </View>
            </>
          )}

          {rest.length > 0 && (
            <View style={styles.sectionHead}>
              <Headline text={t.newsAll} size={34} accent="last" />
            </View>
          )}
        </>
      )}
    </View>
  );

  const renderItem = ({ item, index }: { item: NewsCard; index: number }) =>
    // Every sixth story gets the big treatment to break the rhythm.
    index % 6 === 0 && item.image ? (
      <Pressable onPress={() => open(item)} style={({ pressed }) => [styles.bigCard, pressed && styles.pressed]}>
        <View>
          <Image source={{ uri: item.image }} style={styles.bigImage} resizeMode="cover" />
          <Sticker text={item.kicker} style={styles.bigSticker} />
        </View>
        <Headline text={item.headline} size={30} accent="none" numberOfLines={4} style={{ marginTop: 14 }} />
        <Text style={styles.teaser} numberOfLines={3}>{item.teaser}</Text>
        <Meta>{`BETINA NEWS · ${timeAgo(item.published_at, t)}`}</Meta>
      </Pressable>
    ) : (
      <Pressable onPress={() => open(item)} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
        <View style={styles.rowBody}>
          <Meta color={Colors.primary}>{item.kicker}</Meta>
          <Text style={styles.rowTitle} numberOfLines={3}>{item.headline.toUpperCase()}</Text>
          <Text style={styles.rowTeaser} numberOfLines={2}>{item.teaser}</Text>
          <Meta>{timeAgo(item.published_at, t)}</Meta>
        </View>
        {item.image ? <Image source={{ uri: item.image }} style={styles.rowThumb} resizeMode="cover" /> : null}
      </Pressable>
    );

  return (
    <ScreenBg>
      <FlatList
        data={lead ? rest : []}
        keyExtractor={(c) => String(c.id)}
        renderItem={renderItem}
        ListHeaderComponent={header}
        ListFooterComponent={loadingMore ? <ActivityIndicator color={Colors.primary} style={{ marginVertical: 24 }} /> : null}
        onEndReached={loadMore}
        onEndReachedThreshold={1.5}
        contentContainerStyle={{ paddingTop: chrome.top, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        windowSize={9}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} progressViewOffset={chrome.top} />}
      />
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  chips: { gap: 6, paddingHorizontal: 16, paddingVertical: 14 },
  chip: { borderWidth: 1.5, borderColor: Colors.borderStrong, paddingHorizontal: 12, paddingVertical: 7 },
  chipOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipPressed: { borderColor: Colors.primary },
  chipText: { color: Colors.textSecondary, fontSize: 14, fontFamily: Fonts.label, letterSpacing: 0.6 },
  chipTextOn: { color: Colors.black },
  empty: { padding: 16, paddingTop: 40 },
  pressed: { backgroundColor: Colors.card },

  hero: { height: 480, backgroundColor: Colors.card, overflow: 'hidden' },
  heroSticker: { position: 'absolute', left: 16, top: 16 },
  heroText: { position: 'absolute', left: 16, right: 16, bottom: 18, gap: 10 },
  heroTeaser: { color: Colors.accentLight, fontSize: Typography.base, lineHeight: 21, fontFamily: Fonts.medium },

  sectionHead: { paddingHorizontal: 16, paddingTop: 26, paddingBottom: 8 },
  matchCard: { marginHorizontal: 16, marginTop: 6, backgroundColor: Colors.primary, padding: 16, gap: 6 },
  matchTeams: { color: Colors.black, fontSize: 36, lineHeight: 36, fontFamily: Fonts.display },
  matchVs: { color: Colors.black, fontSize: 18, fontFamily: Fonts.label },
  resultRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.line,
  },
  resultTeam: { flex: 1, color: Colors.white, fontSize: 16, fontFamily: Fonts.label, letterSpacing: 0.3 },
  resultScore: { color: Colors.primary, fontSize: 24, fontFamily: Fonts.display, minWidth: 54, textAlign: 'center' },
  teamNews: { gap: 10, paddingHorizontal: 16, paddingTop: 14 },
  teamCard: { width: 240, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface },
  teamImage: { width: '100%', height: 130 },
  teamCardText: { padding: 12, gap: 6 },
  teamCardTitle: { color: Colors.white, fontSize: 17, lineHeight: 19, fontFamily: Fonts.label },

  list: { paddingHorizontal: 16 },
  topRow: { flexDirection: 'row', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.line, alignItems: 'flex-start' },
  topNum: { width: 46 },
  thumb: { width: 78, height: 78 },

  row: {
    flexDirection: 'row', gap: 14, marginHorizontal: 16, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.line, alignItems: 'flex-start',
  },
  rowBody: { flex: 1, gap: 6, minWidth: 0 },
  rowTitle: { color: Colors.white, fontSize: 19, lineHeight: 21, fontFamily: Fonts.label },
  rowTeaser: { color: Colors.textSecondary, fontSize: 14, lineHeight: 19, fontFamily: Fonts.regular },
  rowThumb: { width: 104, height: 104 },

  bigCard: { marginHorizontal: 16, paddingVertical: 20, gap: 10, borderBottomWidth: 1, borderBottomColor: Colors.line },
  bigImage: { width: '100%', height: 220 },
  bigSticker: { position: 'absolute', left: 10, bottom: -12 },
  teaser: { color: Colors.accentLight, fontSize: Typography.base, lineHeight: 21, fontFamily: Fonts.medium },
});
