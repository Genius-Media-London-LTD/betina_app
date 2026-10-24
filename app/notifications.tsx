import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import BackButton from '../src/components/BackButton';
import BETinaAvatar from '../src/components/BETinaAvatar';
import ScreenBg from '../src/components/ScreenBg';
import { Meta, Sticker } from '../src/components/Urban';
import { tiers } from '../src/lib/demo';
import { useI18n } from '../src/lib/i18n';
import { useProfile } from '../src/hooks/useProfile';
import { fetchNews, fetchTeamNext, formatKickoff, timeAgo } from '../src/lib/sports';
import { supabase } from '../src/lib/supabase';
import { Colors, Fonts } from '../src/theme';

type Tag = 'BETINA' | 'NEWS' | 'XP';

type FeedItem = {
  id: string;
  tag: Tag;
  title: string;
  body: string;
  ts: number; // epoch ms — for sort + day grouping
  unread: boolean;
};

const FILTERS: (Tag | null)[] = [null, 'BETINA', 'NEWS', 'XP'];

function NotificationRow({ item, index, read }: { item: FeedItem; index: number; read: boolean }) {
  const unread = item.unread && !read;
  const tagLime = item.tag !== 'NEWS';
  return (
    <Animated.View entering={FadeInDown.delay(40 + index * 40).duration(350)} style={styles.row}>
      <View style={[styles.marker, unread && styles.markerOn]} />
      <View style={styles.rowBody}>
        <View style={styles.rowHead}>
          <View style={[styles.tag, tagLime ? styles.tagLime : styles.tagOutline]}>
            <Text style={[styles.tagText, tagLime && { color: Colors.black }]}>{item.tag}</Text>
          </View>
          <Meta>{formatClock(item.ts)}</Meta>
        </View>
        <Text style={[styles.rowTitle, !unread && styles.rowTitleRead]} numberOfLines={2}>{item.title.toUpperCase()}</Text>
        <Text style={styles.rowText} numberOfLines={3}>{item.body}</Text>
      </View>
    </Animated.View>
  );
}

function formatClock(ts: number) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function isToday(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export default function Notifications() {
  const insets = useSafeAreaInsets();
  const { t, lang } = useI18n();
  const { profile } = useProfile();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [readAll, setReadAll] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState<Tag | null>(null);

  const teamId = profile?.favourite_team_id ?? null;
  const team = profile?.favourite_team ?? null;

  useEffect(() => {
    if (!profile) return;
    let active = true;

    (async () => {
      const now = Date.now();
      const feed: FeedItem[] = [];

      // 1. Status — tier & XP progress (always available)
      const xp = profile.xp_points ?? 0;
      const idx = tiers.findIndex((x) => x.name === (profile.vip_tier ?? 'INITIATE'));
      const nextTier = tiers[idx + 1] ?? null;
      feed.push({
        id: 'status',
        tag: 'XP',
        title: t.notifStatusTitle,
        body: nextTier
          ? t.notifStatusBody.replace('{n}', String(nextTier.minXp - xp)).replace('{tier}', nextTier.name)
          : t.tiersTop1,
        ts: now,
        unread: true,
      });

      // 2. Streak (if the player has one going)
      if ((profile.streak_days ?? 0) > 0) {
        feed.push({
          id: 'streak',
          tag: 'XP',
          title: t.notifStreakTitle,
          body: t.notifStreakBody.replace('{n}', String(profile.streak_days)),
          ts: now - 60_000,
          unread: true,
        });
      }

      // 3. Next fixture reminder for the favourite team
      if (teamId) {
        const events = await fetchTeamNext(teamId);
        const next = events[0];
        if (next) {
          feed.push({
            id: `fixture-${next.id}`,
            tag: 'BETINA',
            title: team ?? next.home,
            body: `${next.home} vs ${next.away} · ${formatKickoff(next.date, next.time, lang, {
              today: t.homeToday,
              tomorrow: t.homeTomorrow,
            })}`,
            ts: now - 120_000,
            unread: true,
          });
        }
      }

      // 4. Latest sports headlines
      const news = await fetchNews('sport', 3, lang);
      news.slice(0, 2).forEach((n, i) => {
        const ts = new Date(n.pubDate).getTime();
        feed.push({
          id: `news-${i}`,
          tag: 'NEWS',
          title: n.title,
          body: timeAgo(n.pubDate, {
            justNow: t.liveJustNow,
            hours: t.liveAgoHours,
            days: t.liveAgoDays,
          }),
          ts: Number.isNaN(ts) ? now - 3_600_000 : ts,
          unread: false,
        });
      });

      // 5. Real system notifications written by the backend (if any)
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from('notifications')
            .select('id, type, title, body, read, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20);
          (data ?? []).forEach((n) => {
            feed.push({
              id: `db-${n.id}`,
              tag: 'BETINA',
              title: n.title,
              body: n.body,
              ts: new Date(n.created_at).getTime(),
              unread: !n.read,
            });
          });
        }
      } catch {
        // offline / table empty — the generated feed still stands
      }

      feed.sort((a, b) => b.ts - a.ts);
      if (active) {
        setItems(feed);
        setLoaded(true);
      }
    })();

    return () => { active = false; };
  }, [profile, teamId, team, lang, t]);

  const shown = useMemo(() => (filter ? items.filter((i) => i.tag === filter) : items), [items, filter]);
  const today = useMemo(() => shown.filter((i) => isToday(i.ts)), [shown]);
  const earlier = useMemo(() => shown.filter((i) => !isToday(i.ts)), [shown]);
  const unreadCount = items.filter((i) => i.unread && !readAll).length;

  return (
    <ScreenBg>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <BackButton />
          {unreadCount > 0 && (
            <Pressable onPress={() => { Haptics.selectionAsync(); setReadAll(true); }} hitSlop={8}>
              <Meta color={Colors.primary} style={styles.markRead}>{t.notifMarkRead}</Meta>
            </Pressable>
          )}
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>INBOX</Text>
          {unreadCount > 0 && <Sticker text={`${unreadCount} ${t.notifNew}`} rotate={-6} size={26} />}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {FILTERS.map((f) => {
            const on = filter === f;
            return (
              <Pressable
                key={f ?? 'all'}
                onPress={() => { Haptics.selectionAsync(); setFilter(f); }}
                style={[styles.filter, on && styles.filterOn]}
              >
                <Text style={[styles.filterText, on && styles.filterTextOn]}>{f ?? t.notifAll.toUpperCase()}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {loaded && shown.length === 0 && (
          <View style={styles.empty}>
            <BETinaAvatar size={42} />
            <Text style={styles.emptyText}>{t.notifEmpty}</Text>
          </View>
        )}

        {today.length > 0 && (
          <View>
            <Meta style={styles.day}>{`— ${t.notifToday}`}</Meta>
            {today.map((item, i) => (
              <NotificationRow key={item.id} item={item} index={i} read={readAll} />
            ))}
          </View>
        )}

        {earlier.length > 0 && (
          <View>
            <Meta style={styles.day}>{`— ${t.notifEarlier}`}</Meta>
            {earlier.map((item, i) => (
              <NotificationRow key={item.id} item={item} index={i} read={readAll} />
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, gap: 14 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  markRead: { textDecorationLine: 'underline' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  title: { color: Colors.white, fontSize: 72, lineHeight: 74, fontFamily: Fonts.display },
  filters: { gap: 6 },
  filter: { borderWidth: 1.5, borderColor: Colors.borderStrong, paddingHorizontal: 12, paddingVertical: 7 },
  filterOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { color: Colors.white, fontSize: 14, fontFamily: Fonts.label, letterSpacing: 0.5 },
  filterTextOn: { color: Colors.black },
  empty: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  emptyText: { flex: 1, color: Colors.textSecondary, fontSize: 14, fontFamily: Fonts.medium, lineHeight: 20 },
  day: { paddingVertical: 8 },
  row: { flexDirection: 'row', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.line },
  marker: { width: 8, height: 8, marginTop: 6, backgroundColor: 'transparent' },
  markerOn: { backgroundColor: Colors.primary },
  rowBody: { flex: 1, gap: 6 },
  rowHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tag: { paddingHorizontal: 6, paddingVertical: 1, borderWidth: 1.5 },
  tagLime: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tagOutline: { borderColor: Colors.white },
  tagText: { color: Colors.white, fontSize: 10, fontFamily: Fonts.monoBold, letterSpacing: 0.8 },
  rowTitle: { color: Colors.white, fontSize: 19, lineHeight: 21, fontFamily: Fonts.label },
  rowTitleRead: { color: Colors.textSecondary },
  rowText: { color: Colors.textSecondary, fontSize: 14, lineHeight: 20, fontFamily: Fonts.medium },
});
