import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import GlowCard from '../../src/components/GlowCard';
import ScreenBg from '../../src/components/ScreenBg';
import { useProfile } from '../../src/hooks/useProfile';
import { SPORT_KEYS, useI18n } from '../../src/lib/i18n';
import { formatPublishedMonth } from '../../src/lib/newsDate';
import { mentionsTeam } from '../../src/lib/sports';
import { Colors, Fonts, Spacing, Typography } from '../../src/theme';

const API = 'https://intelligence.geniusbet.com';

const ALL_SPORT_TABS = [
  { id: 'football',   emoji: '⚽' },
  { id: 'tennis',     emoji: '🎾' },
  { id: 'basketball', emoji: '🏀' },
  { id: 'cricket',    emoji: '🏏' },
  { id: 'rugby',      emoji: '🏉' },
  { id: 'athletics',  emoji: '🏃' },
  { id: 'golf',       emoji: '⛳' },
  { id: 'sport',      emoji: '🌍' },
];

// Map app sport IDs to BBC feed IDs
const SPORT_TO_BBC: Record<string, string> = {
  football: 'football', tennis: 'tennis', basketball: 'sport',
  cricket: 'cricket', rugby: 'rugby', athletics: 'athletics',
  golf: 'golf', nfl: 'sport', mma: 'sport', esports: 'sport',
};

type NewsItem = { title: string; description: string; link: string; pubDate: string; publishedMonth?: string; image?: string };
type MatchEvent = { id: string; name: string; home: string; away: string; homeScore: string | null; awayScore: string | null; date: string; time: string; league: string };

function timeAgo(dateStr: string, t: { liveJustNow: string; liveAgoHours: string; liveAgoDays: string }) {
  const d = new Date(dateStr);
  const diff = (Date.now() - d.getTime()) / 1000 / 60 / 60;
  if (diff < 1) return t.liveJustNow;
  if (diff < 24) return t.liveAgoHours.replace('{n}', String(Math.floor(diff)));
  return t.liveAgoDays.replace('{n}', String(Math.floor(diff / 24)));
}

function newsDate(item: NewsItem, lang: string, t: { liveJustNow: string; liveAgoHours: string; liveAgoDays: string }) {
  return formatPublishedMonth(item.publishedMonth, lang) || timeAgo(item.pubDate, t);
}

function formatMatchDate(dateStr: string, timeStr: string) {
  const d = new Date(`${dateStr}T${timeStr || '00:00:00'}`);
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) +
    (timeStr ? ' · ' + timeStr.slice(0, 5) : '');
}

export default function Live() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();
  const [sport, setSport] = useState('football');
  const [activeTabs, setActiveTabs] = useState(ALL_SPORT_TABS);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [nextEvents, setNextEvents] = useState<MatchEvent[]>([]);
  const [lastEvents, setLastEvents] = useState<MatchEvent[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const teamId = (profile as any)?.favourite_team_id ?? null;
  const teamName = profile?.favourite_team ?? null;

  useEffect(() => {
    if (!profile) return;
    const saved = (profile as any)?.favourite_sports as string | null;
    if (!saved) return;
    const sportIds = saved.split(',').filter(Boolean);
    // Map user sport IDs to BBC tab IDs, deduplicate
    const bbcIds = [...new Set(sportIds.map((s) => SPORT_TO_BBC[s] ?? 'sport'))];
    // Build tabs: matching BBC tabs + always add "All Sports" at end
    const allSportsTab = ALL_SPORT_TABS[ALL_SPORT_TABS.length - 1];
    const filtered = ALL_SPORT_TABS.filter(
      (t) => t.id !== 'sport' && bbcIds.includes(t.id)
    );
    const tabs = filtered.length > 0 ? [...filtered, allSportsTab] : ALL_SPORT_TABS;
    setActiveTabs(tabs);
    // Default to first matched tab
    setSport(filtered[0]?.id ?? 'sport');
  }, [profile?.favourite_sports]);

  useEffect(() => { fetchNews(); }, [sport, lang]);
  useEffect(() => { if (teamId) fetchTeamData(); }, [teamId]);

  const fetchNews = async () => {
    setLoadingNews(true);
    try {
      const r = await fetch(`${API}/api/sports/news?sport=${sport}&count=12&lang=${lang}`);
      const d = await r.json();
      const items: NewsItem[] = d.items ?? [];
      // Surface anything about the player's team first (source is sport-wide)
      if (teamName) {
        items.sort(
          (a, b) => Number(mentionsTeam(b, teamName)) - Number(mentionsTeam(a, teamName)),
        );
      }
      setNews(items);
    } finally {
      setLoadingNews(false);
    }
  };

  const fetchTeamData = async () => {
    if (!teamId) return;
    setLoadingTeam(true);
    try {
      const [nextR, lastR] = await Promise.all([
        fetch(`${API}/api/sports/team/${teamId}/next`),
        fetch(`${API}/api/sports/team/${teamId}/last`),
      ]);
      const nextD = await nextR.json();
      const lastD = await lastR.json();
      setNextEvents(nextD.events ?? []);
      setLastEvents(lastD.events ?? []);
    } finally {
      setLoadingTeam(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchNews(), teamId ? fetchTeamData() : Promise.resolve()]);
    setRefreshing(false);
  };

  return (
    <ScreenBg glowTop={0.14} glowSize={460}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.lg, paddingBottom: 130 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
          <Text style={styles.title}>{t.liveTitle}</Text>
          <Pressable onPress={() => router.push('/notifications')} style={styles.bell}>
            <Text style={styles.bellEmoji}>🔔</Text>
            <View style={styles.bellDot} />
          </Pressable>
        </Animated.View>

        {/* YOUR TEAM section */}
        {teamName && (
          <Animated.View entering={FadeInDown.delay(60).duration(500)} style={styles.section}>
            <Text style={styles.sectionTitle}>🏟 {teamName}</Text>

            {loadingTeam ? (
              <ActivityIndicator color={Colors.primary} style={{ marginTop: 12 }} />
            ) : (
              <>
                {nextEvents.length > 0 && (
                  <GlowCard style={styles.matchCard}>
                    <Text style={styles.matchLabel}>{t.liveUpcoming}</Text>
                    {nextEvents.slice(0, 3).map((e) => (
                      <View key={e.id} style={styles.matchRow}>
                        <View style={styles.matchTeams}>
                          <Text style={styles.matchTeam}>{e.home}</Text>
                          <Text style={styles.matchVs}>vs</Text>
                          <Text style={styles.matchTeam}>{e.away}</Text>
                        </View>
                        <View style={styles.matchMeta}>
                          <Text style={styles.matchLeague}>{e.league}</Text>
                          <Text style={styles.matchDate}>{formatMatchDate(e.date, e.time)}</Text>
                        </View>
                      </View>
                    ))}
                  </GlowCard>
                )}

                {lastEvents.length > 0 && (
                  <GlowCard style={styles.matchCard}>
                    <Text style={styles.matchLabel}>{t.liveResults}</Text>
                    {lastEvents.slice(0, 3).map((e) => (
                      <View key={e.id} style={styles.matchRow}>
                        <View style={styles.matchTeams}>
                          <Text style={styles.matchTeam}>{e.home}</Text>
                          <Text style={[styles.matchScore, styles.matchScoreBig]}>
                            {e.homeScore ?? '?'} – {e.awayScore ?? '?'}
                          </Text>
                          <Text style={styles.matchTeam}>{e.away}</Text>
                        </View>
                        <Text style={styles.matchDate}>{e.date}</Text>
                      </View>
                    ))}
                  </GlowCard>
                )}

                {!nextEvents.length && !lastEvents.length && (
                  <GlowCard style={styles.emptyCard}>
                    <Text style={styles.emptyText}>No upcoming fixtures found for {teamName}</Text>
                  </GlowCard>
                )}
              </>
            )}
          </Animated.View>
        )}

        {/* Sport tab pills */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
            {activeTabs.map((tab) => (
              <Pressable
                key={tab.id}
                onPress={() => setSport(tab.id)}
                style={[styles.tab, sport === tab.id && styles.tabActive]}
              >
                <Text style={[styles.tabLabel, sport === tab.id && styles.tabLabelActive]}>
                  {tab.emoji} {SPORT_KEYS[tab.id] ? t[SPORT_KEYS[tab.id]] : tab.id}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        {/* News */}
        <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.section}>
          <Text style={styles.sectionTitle}>📰 {t.liveLatestNews}</Text>

          {loadingNews ? (
            <ActivityIndicator color={Colors.primary} style={{ marginTop: 16 }} />
          ) : news.length === 0 ? (
            <GlowCard style={styles.emptyCard}>
              <Text style={styles.emptyText}>{t.liveNoNews}</Text>
            </GlowCard>
          ) : (
            <>
              {/* First item: featured large card */}
              {news[0] && (
                <Pressable onPress={() => news[0].link && router.push({ pathname: '/article', params: { url: news[0].link, title: news[0].title, pubDate: news[0].pubDate, image: news[0].image ?? '' } })}>
                  <GlowCard style={styles.featuredCard}>
                    {news[0].image ? (
                      <Image source={{ uri: news[0].image }} style={styles.featuredImage} resizeMode="cover" />
                    ) : (
                      <View style={[styles.featuredImage, styles.imagePlaceholder]}>
                        <Text style={styles.imagePlaceholderEmoji}>📰</Text>
                      </View>
                    )}
                    <View style={styles.featuredBadge}>
                      <Text style={styles.featuredBadgeText}>{t.liveTopStory}</Text>
                    </View>
                    <View style={styles.featuredContent}>
                      <Text style={styles.featuredTitle} numberOfLines={3}>{news[0].title}</Text>
                      <Text style={styles.newsTime}>{newsDate(news[0], lang, t)}</Text>
                    </View>
                  </GlowCard>
                </Pressable>
              )}
              {/* Rest: compact horizontal image + text */}
              {news.slice(1).map((item, idx) => (
                <Pressable key={idx + 1} onPress={() => item.link && router.push({ pathname: '/article', params: { url: item.link, title: item.title, pubDate: item.pubDate, image: item.image ?? '' } })}>
                  <GlowCard style={styles.newsCard}>
                    {item.image && (
                      <Image source={{ uri: item.image }} style={styles.newsThumb} resizeMode="cover" />
                    )}
                    <View style={styles.newsBody}>
                      <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
                      <Text style={styles.newsTime}>{newsDate(item, lang, t)}</Text>
                    </View>
                  </GlowCard>
                </Pressable>
              ))}
            </>
          )}
        </Animated.View>
      </ScrollView>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: Spacing.lg, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: '#FFFFFF', fontSize: Typography.xl - 2, fontFamily: Fonts.bold },
  bell: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.glass, borderWidth: 1, borderColor: Colors.glassBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  bellEmoji: { fontSize: 16 },
  bellDot: {
    position: 'absolute', top: 5, right: 6, width: 9, height: 9,
    borderRadius: 5, backgroundColor: Colors.primary, borderWidth: 2, borderColor: Colors.background,
  },
  section: { gap: 10 },
  sectionTitle: { color: '#FFFFFF', fontSize: Typography.base + 1, fontFamily: Fonts.bold, paddingLeft: 2 },
  tabs: { gap: 8, paddingVertical: 2 },
  tab: {
    paddingHorizontal: 16, paddingVertical: 9,
    borderRadius: 999, backgroundColor: Colors.glass,
    borderWidth: 1, borderColor: Colors.glassBorder,
  },
  tabActive: { backgroundColor: 'rgba(184,233,38,0.14)', borderColor: 'rgba(184,233,38,0.6)' },
  tabLabel: { color: Colors.textSecondary, fontSize: Typography.sm, fontFamily: Fonts.semibold },
  tabLabelActive: { color: '#FFFFFF' },
  matchCard: { gap: 12, padding: 16 },
  matchLabel: {
    color: Colors.primary, fontSize: Typography.xs, fontFamily: Fonts.bold,
    letterSpacing: 1.2, textTransform: 'uppercase',
  },
  matchRow: { gap: 4 },
  matchTeams: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  matchTeam: { flex: 1, color: '#FFFFFF', fontSize: Typography.sm + 1, fontFamily: Fonts.semibold },
  matchVs: { color: '#55556A', fontSize: Typography.xs + 1, fontFamily: Fonts.bold },
  matchScore: { color: Colors.primary, fontFamily: Fonts.bold },
  matchScoreBig: { fontSize: Typography.base, paddingHorizontal: 4 },
  matchMeta: { gap: 2 },
  matchLeague: { color: Colors.textSecondary, fontSize: Typography.xs, fontFamily: Fonts.medium },
  matchDate: { color: Colors.textSecondary, fontSize: Typography.xs, fontFamily: Fonts.medium },
  featuredCard: { padding: 0, overflow: 'hidden', gap: 0 },
  featuredImage: { width: '100%', height: 200, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  imagePlaceholder: { backgroundColor: '#1A1A2E', alignItems: 'center', justifyContent: 'center' },
  imagePlaceholderEmoji: { fontSize: 40 },
  featuredBadge: {
    position: 'absolute', top: 12, left: 12,
    backgroundColor: 'rgba(184,233,38,0.9)', borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  featuredBadgeText: { color: '#000', fontSize: Typography.xs - 1, fontFamily: Fonts.bold, letterSpacing: 0.8 },
  featuredContent: { padding: 14, gap: 6 },
  featuredTitle: { color: '#FFFFFF', fontSize: Typography.base + 1, fontFamily: Fonts.bold, lineHeight: 24 },
  newsCard: { flexDirection: 'row', gap: 12, padding: 12, alignItems: 'center' },
  newsThumb: { width: 80, height: 80, borderRadius: 10 },
  newsBody: { flex: 1, gap: 6 },
  newsTitle: { color: '#FFFFFF', fontSize: Typography.sm, fontFamily: Fonts.semibold, lineHeight: 20 },
  newsTime: { color: '#55556A', fontSize: Typography.xs, fontFamily: Fonts.medium },
  emptyCard: { padding: 20, alignItems: 'center' },
  emptyText: { color: Colors.textSecondary, fontSize: Typography.sm, fontFamily: Fonts.medium, textAlign: 'center' },
});
