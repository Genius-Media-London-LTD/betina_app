import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import BackButton from '../src/components/BackButton';
import BETinaAvatar from '../src/components/BETinaAvatar';
import GlowCard from '../src/components/GlowCard';
import ScreenBg from '../src/components/ScreenBg';
import SectionLabel from '../src/components/SectionLabel';
import { tiers } from '../src/lib/demo';
import { useI18n } from '../src/lib/i18n';
import { useProfile } from '../src/hooks/useProfile';
import { formatPublishedMonth } from '../src/lib/newsDate';
import { fetchNews, fetchTeamNext, formatKickoff, timeAgo } from '../src/lib/sports';
import { supabase } from '../src/lib/supabase';
import { Colors, Fonts, Spacing, Typography } from '../src/theme';

type Accent = 'gold' | 'green' | 'purple' | 'none';

type FeedItem = {
  id: string;
  icon: string; // emoji, or '' when avatar is used
  avatar?: boolean;
  title: string;
  body: string;
  ts: number; // epoch ms — for sort + day grouping
  unread: boolean;
  accent: Accent;
};

function NotificationCard({ item, index, read }: { item: FeedItem; index: number; read: boolean }) {
  const unread = item.unread && !read;
  return (
    <Animated.View entering={FadeInDown.delay(60 + index * 50).duration(400)}>
      <GlowCard
        variant={item.accent === 'gold' ? 'gold' : 'glass'}
        style={[
          styles.card,
          item.accent === 'purple' && styles.purpleCard,
          !unread && { opacity: 0.75 },
        ]}
      >
        {item.avatar ? (
          <BETinaAvatar size={42} />
        ) : (
          <View
            style={[
              styles.iconBox,
              item.accent === 'gold' && styles.iconBoxGold,
              item.accent === 'green' && styles.iconBoxGreen,
            ]}
          >
            <Text style={styles.iconEmoji}>{item.icon}</Text>
          </View>
        )}
        <View style={styles.cardBody}>
          <View style={styles.cardTitleRow}>
            <Text
              style={[styles.cardTitle, item.accent === 'gold' && styles.cardTitleGold]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <View style={styles.timeWrap}>
              {unread && <View style={styles.unreadDot} />}
              <Text style={styles.time}>{formatClock(item.ts)}</Text>
            </View>
          </View>
          <Text style={styles.cardText} numberOfLines={3}>
            {item.body}
          </Text>
        </View>
      </GlowCard>
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
        icon: '🏆',
        title: t.notifStatusTitle,
        body: nextTier
          ? t.notifStatusBody.replace('{n}', String(nextTier.minXp - xp)).replace('{tier}', nextTier.name)
          : t.tiersTop1,
        ts: now,
        unread: true,
        accent: 'gold',
      });

      // 2. Streak (if the player has one going)
      if ((profile.streak_days ?? 0) > 0) {
        feed.push({
          id: 'streak',
          icon: '🔥',
          title: t.notifStreakTitle,
          body: t.notifStreakBody.replace('{n}', String(profile.streak_days)),
          ts: now - 60_000,
          unread: true,
          accent: 'green',
        });
      }

      // 3. Next fixture reminder for the favourite team
      if (teamId) {
        const events = await fetchTeamNext(teamId);
        const next = events[0];
        if (next) {
          feed.push({
            id: `fixture-${next.id}`,
            icon: '',
            avatar: true,
            title: team ?? next.home,
            body: `${next.home} vs ${next.away} · ${formatKickoff(next.date, next.time, lang, {
              today: t.homeToday,
              tomorrow: t.homeTomorrow,
            })}`,
            ts: now - 120_000,
            unread: true,
            accent: 'purple',
          });
        }
      }

      // 4. Latest sports headlines
      const news = await fetchNews('sport', 3, lang);
      news.slice(0, 2).forEach((n, i) => {
        const ts = new Date(n.pubDate).getTime();
        feed.push({
          id: `news-${i}`,
          icon: '📰',
          title: n.title,
          body: formatPublishedMonth(n.publishedMonth, lang) || timeAgo(n.pubDate, {
            justNow: t.liveJustNow,
            hours: t.liveAgoHours,
            days: t.liveAgoDays,
          }),
          ts: Number.isNaN(ts) ? now - 3_600_000 : ts,
          unread: false,
          accent: 'none',
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
              icon: '🔔',
              title: n.title,
              body: n.body,
              ts: new Date(n.created_at).getTime(),
              unread: !n.read,
              accent: 'none',
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

  const today = useMemo(() => items.filter((i) => isToday(i.ts)), [items]);
  const earlier = useMemo(() => items.filter((i) => !isToday(i.ts)), [items]);
  const unreadCount = items.filter((i) => i.unread && !readAll).length;

  return (
    <ScreenBg glowTop={0.16} glowSize={460}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.base, paddingBottom: insets.bottom + Spacing['2xl'] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <BackButton />
            <Text style={styles.title}>{t.notifTitle}</Text>
          </View>
          <View style={styles.headerRight}>
            {unreadCount > 0 && (
              <View style={styles.newPill}>
                <Text style={styles.newPillLabel}>{unreadCount} {t.notifNew}</Text>
              </View>
            )}
            {unreadCount > 0 && (
              <Pressable onPress={() => setReadAll(true)} hitSlop={8}>
                <Text style={styles.markRead}>{t.notifMarkRead}</Text>
              </Pressable>
            )}
          </View>
        </View>

        {loaded && items.length === 0 && (
          <GlowCard style={styles.emptyCard}>
            <BETinaAvatar size={42} />
            <Text style={styles.emptyText}>{t.notifEmpty}</Text>
          </GlowCard>
        )}

        {today.length > 0 && (
          <View style={styles.section}>
            <SectionLabel>{t.notifToday}</SectionLabel>
            {today.map((item, i) => (
              <NotificationCard key={item.id} item={item} index={i} read={readAll} />
            ))}
          </View>
        )}

        {earlier.length > 0 && (
          <View style={styles.section}>
            <SectionLabel>{t.notifEarlier}</SectionLabel>
            {earlier.map((item, i) => (
              <NotificationCard key={item.id} item={item} index={i} read={readAll} />
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: Spacing.lg, gap: Spacing.base },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  title: { color: '#FFFFFF', fontSize: Typography.xl, fontFamily: Fonts.bold },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  newPill: {
    backgroundColor: 'rgba(184,233,38,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(184,233,38,0.4)',
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 11,
  },
  newPillLabel: { color: Colors.primary, fontSize: Typography.xs, fontFamily: Fonts.bold },
  markRead: { color: Colors.primary, fontSize: Typography.sm, fontFamily: Fonts.semibold },
  section: { gap: Spacing.sm + 2 },
  emptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  emptyText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    fontFamily: Fonts.medium,
    lineHeight: 20,
  },
  card: { flexDirection: 'row', gap: Spacing.md, paddingVertical: 15, paddingHorizontal: 16 },
  purpleCard: {
    backgroundColor: 'rgba(139,92,246,0.18)',
    borderColor: 'rgba(139,92,246,0.4)',
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxGold: { backgroundColor: 'rgba(255,215,0,0.15)', borderColor: 'rgba(255,215,0,0.35)' },
  iconBoxGreen: { backgroundColor: 'rgba(184,233,38,0.1)', borderColor: 'rgba(184,233,38,0.3)' },
  iconEmoji: { fontSize: 20 },
  cardBody: { flex: 1, gap: 3 },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  cardTitle: { flex: 1, color: '#FFFFFF', fontSize: Typography.sm + 1, fontFamily: Fonts.bold },
  cardTitleGold: { color: Colors.gold },
  timeWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  time: { color: '#55556A', fontSize: Typography.xs, fontFamily: Fonts.semibold },
  cardText: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    fontFamily: Fonts.medium,
    lineHeight: 19,
  },
});
