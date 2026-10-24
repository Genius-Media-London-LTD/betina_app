import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import ScreenBg from '../components/ScreenBg';
import { Headline, Meta, OutlineNumber, Sticker, Ticker } from '../components/Urban';
import { useProfile } from '../hooks/useProfile';
import { SPORT_KEYS, useI18n } from '../lib/i18n';
import { cleanFeedText, fetchNewsApi, mentionsTeam } from '../lib/sports';
import { useChrome } from '../components/chrome';
import { Colors, Fonts, Typography, withAlpha } from '../theme';

const API = 'https://intelligence.geniusbet.com';

const ALL_SPORT_TABS = ['football', 'tennis', 'basketball', 'cricket', 'rugby', 'athletics', 'golf', 'sport'];

// Map app sport IDs to the news feeds' sport IDs
const SPORT_TO_FEED: Record<string, string> = {
  football: 'football', tennis: 'tennis', basketball: 'sport',
  cricket: 'cricket', rugby: 'rugby', athletics: 'athletics',
  golf: 'golf', nfl: 'sport', mma: 'sport', esports: 'sport',
};

// Fallback source label when an item has none (the news gateway sets one per item).
const SOURCE_BY_LANG: Record<string, string> = {
  en: 'BBC Sport', de: 'Sportschau', es: 'Marca', fr: 'RMC Sport', pt: 'Record',
};

type NewsItem = { title: string; description: string; link: string; pubDate: string; image?: string; source?: string };
type MatchEvent = { id: string; name: string; home: string; away: string; homeScore: string | null; awayScore: string | null; date: string; time: string; league: string };

function timeAgo(dateStr: string, t: { liveJustNow: string; liveAgoHours: string; liveAgoDays: string }) {
  const d = new Date(dateStr);
  const diff = (Date.now() - d.getTime()) / 1000 / 60 / 60;
  if (diff < 1) return t.liveJustNow;
  if (diff < 24) return t.liveAgoHours.replace('{n}', String(Math.floor(diff)));
  return t.liveAgoDays.replace('{n}', String(Math.floor(diff / 24)));
}

function formatMatchDate(dateStr: string, timeStr: string, locale: string) {
  const d = new Date(`${dateStr}T${timeStr || '00:00:00'}`);
  return d.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' }) +
    (timeStr ? ' · ' + timeStr.slice(0, 5) : '');
}

export default function NewsScreen() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const chrome = useChrome();
  const { profile } = useProfile();
  const [sport, setSport] = useState('football');
  const [tabs, setTabs] = useState(ALL_SPORT_TABS);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [nextEvents, setNextEvents] = useState<MatchEvent[]>([]);
  const [lastEvents, setLastEvents] = useState<MatchEvent[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const teamId = profile?.favourite_team_id ?? null;
  const teamName = profile?.favourite_team ?? null;
  const fallbackSource = SOURCE_BY_LANG[lang] ?? 'BBC Sport';

  // Sport tabs follow the player's interests (+ "all sports" at the end).
  useEffect(() => {
    const saved = profile?.favourite_sports;
    if (!saved) return;
    const ids = [...new Set(saved.split(',').filter(Boolean).map((s) => SPORT_TO_FEED[s] ?? 'sport'))];
    const picked = ALL_SPORT_TABS.filter((id) => id !== 'sport' && ids.includes(id));
    setTabs(picked.length ? [...picked, 'sport'] : ALL_SPORT_TABS);
    setSport(picked[0] ?? 'sport');
  }, [profile?.favourite_sports]);

  const fetchNews = async () => {
    setLoadingNews(true);
    try {
      const d = await fetchNewsApi('news', `sport=${sport}&count=12&lang=${lang}`);
      const items: NewsItem[] = (d.items ?? []).map((it: NewsItem) => ({
        ...it,
        title: cleanFeedText(it.title),
        description: cleanFeedText(it.description),
      }));
      // Surface anything about the player's team first (the feed is sport-wide).
      if (teamName) items.sort((a, b) => Number(mentionsTeam(b, teamName)) - Number(mentionsTeam(a, teamName)));
      setNews(items);
    } catch {
      setNews([]);
    } finally {
      setLoadingNews(false);
    }
  };

  const fetchTeamData = async () => {
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
  };

  useEffect(() => { fetchNews(); }, [sport, lang]);
  useEffect(() => { if (teamId) fetchTeamData(); }, [teamId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchNews(), fetchTeamData()]);
    setRefreshing(false);
  };

  const open = (item: NewsItem) => {
    if (!item.link) return;
    Haptics.selectionAsync();
    router.push({ pathname: '/article', params: { url: item.link, title: item.title, pubDate: item.pubDate, image: item.image ?? '' } });
  };

  const hero = news[0];
  const stories = news.slice(1);
  const nextMatch = nextEvents[0];

  return (
    <ScreenBg>
      <ScrollView
        contentContainerStyle={{ paddingTop: chrome.top, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} progressViewOffset={chrome.top} />}
      >
        {news.length > 0 && <Ticker label="Breaking" items={news.slice(0, 6).map((n) => n.title)} />}

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
                <Text style={[styles.chipText, on && styles.chipTextOn]}>
                  {(SPORT_KEYS[id] ? String(t[SPORT_KEYS[id]]) : id).toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {loadingNews && news.length === 0 ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
        ) : !hero ? (
          <View style={styles.empty}>
            <Headline text={t.liveNoNews} size={34} accent="none" />
          </View>
        ) : (
          <>
            {/* Lead story */}
            <Animated.View entering={FadeIn.duration(400)}>
              <Pressable onPress={() => open(hero)} style={styles.hero}>
                {hero.image ? (
                  <Image source={{ uri: hero.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                ) : (
                  <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.card }]} />
                )}
                <LinearGradient
                  colors={[withAlpha(Colors.black, 0), withAlpha(Colors.black, 0.85), Colors.black]}
                  locations={[0.3, 0.7, 1]}
                  style={StyleSheet.absoluteFill}
                  pointerEvents="none"
                />
                <Sticker text={t.liveTopStory} style={styles.heroSticker} />
                <View style={styles.heroText}>
                  <Headline text={hero.title} size={44} accent="first" numberOfLines={5} />
                  {!!hero.description && <Text style={styles.heroTeaser} numberOfLines={3}>{hero.description}</Text>}
                  <Meta color={Colors.primary}>{`${hero.source ?? fallbackSource} · ${timeAgo(hero.pubDate, t)}`}</Meta>
                </View>
              </Pressable>
            </Animated.View>

            {/* Your team */}
            {teamName && (nextMatch || lastEvents.length > 0) && (
              <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.block}>
                <View style={styles.sectionHead}>
                  <Headline text={teamName} size={30} accent="last" numberOfLines={1} style={{ flex: 1 }} />
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
              </Animated.View>
            )}

            {/* Top stories */}
            <View style={styles.sectionHead}>
              <Headline text={t.liveLatestNews} size={34} accent="none" />
            </View>
            <View style={styles.list}>
              {stories.map((s, i) => (
                <Animated.View key={s.link || i} entering={FadeInDown.delay(Math.min(i, 8) * 40).duration(350)}>
                  <Pressable onPress={() => open(s)} style={({ pressed }) => [styles.story, pressed && styles.storyPressed]}>
                    <View style={styles.storyNum}>
                      <OutlineNumber value={String(i + 1).padStart(2, '0')} size={40} />
                    </View>
                    <View style={styles.storyBody}>
                      <Meta color={Colors.primary}>{s.source ?? fallbackSource}</Meta>
                      <Text style={styles.storyTitle} numberOfLines={3}>{s.title.toUpperCase()}</Text>
                      <Meta>{timeAgo(s.pubDate, t)}</Meta>
                    </View>
                    {s.image ? (
                      <Image source={{ uri: s.image }} style={styles.thumb} resizeMode="cover" />
                    ) : (
                      <View style={[styles.thumb, { backgroundColor: Colors.card }]} />
                    )}
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
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
  hero: { height: 440, backgroundColor: Colors.card, overflow: 'hidden' },
  heroSticker: { position: 'absolute', left: 16, top: 16 },
  heroText: { position: 'absolute', left: 16, right: 16, bottom: 18, gap: 10 },
  heroTeaser: { color: Colors.accentLight, fontSize: Typography.base, lineHeight: 20, fontFamily: Fonts.medium },
  block: { paddingTop: 8 },
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 22, paddingBottom: 6 },
  matchCard: { marginHorizontal: 16, marginTop: 6, backgroundColor: Colors.primary, padding: 16, gap: 6 },
  matchTeams: { color: Colors.black, fontSize: 36, lineHeight: 36, fontFamily: Fonts.display },
  matchVs: { color: Colors.black, fontSize: 18, fontFamily: Fonts.label },
  resultRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.line,
  },
  resultTeam: { flex: 1, color: Colors.white, fontSize: 16, fontFamily: Fonts.label, letterSpacing: 0.3 },
  resultScore: { color: Colors.primary, fontSize: 24, fontFamily: Fonts.display, minWidth: 54, textAlign: 'center' },
  list: { paddingHorizontal: 16 },
  story: { flexDirection: 'row', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.line, alignItems: 'flex-start' },
  storyPressed: { backgroundColor: Colors.card },
  storyNum: { width: 40 },
  storyBody: { flex: 1, gap: 6, minWidth: 0 },
  storyTitle: { color: Colors.white, fontSize: 19, lineHeight: 20, fontFamily: Fonts.label },
  thumb: { width: 78, height: 78 },
});
