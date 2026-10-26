// The app's frame on a desktop browser: navigation in a sidebar on the left,
// the page in the middle (centred once it reaches PAGE_MAX) and, on wide
// screens, a BETina rail on the right with what is live right now. Same pages
// and routes as the phone pager — only the frame differs.
import React, { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useFocusEffect, usePathname, useRouter } from 'expo-router';
import { ChromeContext } from './chrome';
import XPBar from './XPBar';
import GoalFlash from './live/GoalFlash';
import { MatchRow } from './live/LiveParts';
import { Blink } from './Urban';
import { useProfile } from '../hooks/useProfile';
import { useSession } from '../hooks/useSession';
import { LANGUAGES, useI18n } from '../lib/i18n';
import { useIsAdmin } from '../lib/admin';
import { tiers } from '../lib/demo';
import { isFollowing, useFollows } from '../lib/follows';
import { ContentWidthContext, PAGE_MAX, RAIL_MIN, RAIL_W, SIDEBAR_W } from '../lib/layout';
import { sameTeam, useLiveNow } from '../lib/live';
import { NewsCard, fetchNewsFeed } from '../lib/news';
import { signOut } from '../lib/session';
import { supabase } from '../lib/supabase';
import { Colors, Fonts, displayType } from '../theme';

type Labels = ReturnType<typeof useI18n>['t'];
export type ShellPage = { key: string; route: string; path: string; label: (t: Labels) => string; Component: React.ComponentType };

export default function DesktopShell({ pages }: { pages: ShellPage[] }) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const [unread, setUnread] = useState(0);

  const active = Math.max(0, pages.findIndex((p) => p.path === pathname));
  // Pages stay mounted once opened, so switching back keeps their scroll and state.
  const [mounted, setMounted] = useState<number[]>([active]);
  useEffect(() => {
    setMounted((m) => (m.includes(active) ? m : [...m, active]));
  }, [active]);

  useFocusEffect(useCallback(() => {
    supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('read', false)
      .then(({ count }) => setUnread(count ?? 0));
  }, []));

  const rail = width >= RAIL_MIN;
  const main = width - SIDEBAR_W - (rail ? RAIL_W : 0);
  const content = Math.min(main, PAGE_MAX);
  const page = pages[active]?.key;

  return (
    <ChromeContext.Provider value={{ top: 12, bottom: 0, page }}>
      <View style={styles.root}>
        <Sidebar pages={pages} active={active} unread={unread} onPage={(i) => router.navigate(pages[i].route as never)} />

        <View style={styles.main}>
          <ContentWidthContext.Provider value={content}>
            {pages.map((p, i) => (mounted.includes(i) ? (
              <View key={p.key} style={[styles.page, { width: content }, i !== active && styles.hidden]}>
                <p.Component />
              </View>
            ) : null))}
          </ContentWidthContext.Provider>
        </View>

        {rail && <Rail page={page} onChat={() => router.navigate('/(tabs)/chat' as never)} onLive={() => router.navigate('/(tabs)/scores' as never)} onNews={() => router.navigate('/(tabs)/live' as never)} />}
        <GoalFlash />
      </View>
    </ChromeContext.Provider>
  );
}

// ── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ pages, active, unread, onPage }: { pages: ShellPage[]; active: number; unread: number; onPage: (i: number) => void }) {
  const { t, lang } = useI18n();
  const router = useRouter();
  const session = useSession();
  const { profile } = useProfile();
  const [hover, setHover] = useState<string | null>(null);
  const admin = useIsAdmin();

  const xp = profile?.xp_points ?? 0;
  const tierName = profile?.vip_tier ?? 'INITIATE';
  const ti = Math.max(0, tiers.findIndex((x) => x.name === tierName));
  const next = tiers[ti + 1] ?? null;
  const progress = next ? (xp - tiers[ti].minXp) / (next.minXp - tiers[ti].minXp) : 1;
  const name = (profile?.name ?? '').trim();

  const links: { key: string; label: string; href: string; badge?: string }[] = [
    { key: 'notifications', label: t.notifTitle, href: '/notifications', badge: unread > 0 ? (unread > 9 ? '9+' : String(unread)) : undefined },
    { key: 'tiers', label: t.tiersTitle, href: '/tiers' },
    { key: 'settings', label: t.settingsTitle, href: '/settings' },
    { key: 'language', label: LANGUAGES.find((l) => l.code === lang)?.nativeName ?? t.settingsLanguage, href: '/language' },
    { key: 'help', label: t.settingsHelp, href: '/help' },
    ...(admin ? [{ key: 'admin', label: 'Team dashboard', href: '/admin' }] : []),
  ];

  return (
    <View style={styles.sidebar}>
      <ScrollView contentContainerStyle={styles.sideContent} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => onPage(0)} style={styles.wordmark} accessibilityLabel="BETina">
          <Image source={require('../../assets/urban/logo-mark.png')} style={styles.logoMark} resizeMode="contain" />
          <Text style={styles.wordmarkText}>BET<Text style={{ color: Colors.primary }}>INA</Text></Text>
        </Pressable>

        <View style={styles.nav}>
          {pages.map((p, i) => {
            const on = i === active;
            const hot = on || hover === p.key;
            return (
              <Pressable
                key={p.key}
                onPress={() => onPage(i)}
                onHoverIn={() => setHover(p.key)}
                onHoverOut={() => setHover(null)}
                style={[styles.navItem, on && styles.navItemOn, !on && hover === p.key && styles.navItemHover]}
              >
                <Text style={[styles.navNum, on && styles.navTextOn]}>{String(i + 1).padStart(2, '0')}</Text>
                <Text style={[styles.navLabel, on ? styles.navTextOn : hot && { color: Colors.white }]} numberOfLines={1}>
                  {p.label(t).toUpperCase()}
                </Text>
                {p.key === 'scores' && <View style={styles.navLive}><Blink size={6} color={on ? Colors.black : Colors.live} /></View>}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.links}>
          {links.map((l) => (
            <Pressable
              key={l.key}
              onPress={() => router.push(l.href as never)}
              onHoverIn={() => setHover(l.key)}
              onHoverOut={() => setHover(null)}
              style={styles.link}
            >
              <Text style={[styles.linkText, hover === l.key && { color: Colors.primary }]} numberOfLines={1}>{l.label.toUpperCase()}</Text>
              {l.badge && <Text style={styles.linkBadge}>{l.badge}</Text>}
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View style={styles.sideFoot}>
        {session ? (
          <>
            <Pressable onPress={() => onPage(pages.findIndex((p) => p.key === 'journey'))} style={styles.me}>
              <View style={styles.initial}><Text style={styles.initialText}>{(name[0] ?? 'B').toUpperCase()}</Text></View>
              <View style={{ flex: 1, gap: 5, minWidth: 0 }}>
                <View style={styles.meTop}>
                  <Text style={styles.meName} numberOfLines={1}>{name.toUpperCase() || 'BETINA'}</Text>
                  <Text style={styles.meTier} numberOfLines={1}>{tierName}</Text>
                </View>
                <XPBar progress={progress} height={4} delay={150} />
              </View>
            </Pressable>
            <Pressable onPress={async () => { await signOut(); router.replace('/(auth)/login'); }} hitSlop={6}>
              <Text style={styles.signOut}>{t.settingsLogout.toUpperCase()}</Text>
            </Pressable>
          </>
        ) : session === null ? (
          <Pressable onPress={() => router.push('/(auth)/login')} style={({ pressed }) => [styles.signIn, pressed && { opacity: 0.85 }]}>
            <Text style={styles.signInText} numberOfLines={1}>{t.guestCta.toUpperCase()} →</Text>
          </Pressable>
        ) : null}
        <Text style={styles.responsible}>{t.menuResponsible}</Text>
      </View>
    </View>
  );
}

// ── BETina rail ──────────────────────────────────────────────────────────────
function Rail({ page, onChat, onLive, onNews }: { page?: string; onChat: () => void; onLive: () => void; onNews: () => void }) {
  const { t, lang } = useI18n();
  const router = useRouter();
  const { profile } = useProfile();
  useFollows();
  const live = page !== 'scores';
  const now = useLiveNow(live ? 30_000 : null);
  const [news, setNews] = useState<NewsCard[]>([]);
  useEffect(() => {
    fetchNewsFeed({ lang, limit: 6 }).then(setNews).catch(() => setNews([]));
  }, [lang]);

  const fav = profile?.favourite_team;
  const mine = (r: { id: number; lg: number; h: { id: number; n: string }; a: { id: number; n: string } }) =>
    sameTeam(fav, r.h.n) || sameTeam(fav, r.a.n) || isFollowing('team', r.h.id) || isFollowing('team', r.a.id)
    || isFollowing('match', r.id) || isFollowing('league', r.lg);
  // Own matches first, then the server's order (big leagues first).
  const matches = now ? [...now.matches].sort((a, b) => Number(mine(b)) - Number(mine(a))).slice(0, 8) : [];

  return (
    <View style={styles.rail}>
      <ScrollView contentContainerStyle={styles.railContent} showsVerticalScrollIndicator={false}>
        <View style={styles.betina}>
          <Image source={require('../../assets/urban/betina-smile.jpg')} style={styles.betinaPhoto} resizeMode="cover" />
          <View style={styles.betinaShade} />
          <View style={styles.betinaText}>
            <View style={styles.online}><Blink size={6} color={Colors.primary} /><Text style={styles.onlineText}>ONLINE</Text></View>
            <Text style={styles.betinaName}>BETINA</Text>
          </View>
        </View>
        {page !== 'chat' && (
          <Pressable onPress={onChat} style={({ hovered }: { hovered?: boolean }) => [styles.ask, hovered && styles.askHover]}>
            <Text style={styles.askText} numberOfLines={1}>{t.chatPlaceholder}</Text>
            <Text style={styles.askArrow}>→</Text>
          </Pressable>
        )}

        {live && now && now.matches.length > 0 && (
          <View style={styles.liveBox}>
            <Pressable onPress={onLive} style={styles.liveHead}>
              <Blink size={8} />
              <Text style={styles.liveTitle}>{t.tabLive.toUpperCase()}</Text>
              <Text style={styles.liveCount}>{t.liveNowCount.replace('{n}', String(now.matches.length)).toUpperCase()}</Text>
            </Pressable>
            {matches.map((r, i) => (
              <MatchRow key={r.id} r={r} serverNow={now.serverNow} last={i === matches.length - 1}
                onPress={() => router.push({ pathname: '/match/[id]', params: { id: String(r.id) } })} />
            ))}
            <Pressable onPress={onLive} style={({ hovered }: { hovered?: boolean }) => [styles.liveMore, hovered && { backgroundColor: Colors.cardElevated }]}>
              <Text style={styles.liveMoreText}>{`${t.liveOpenCenter.toUpperCase()} →`}</Text>
            </Pressable>
          </View>
        )}

        {page !== 'news' && news.length > 0 && (
          <View style={styles.newsBox}>
            <Pressable onPress={onNews} style={styles.liveHead}>
              <Text style={styles.liveTitle}>{t.tabNews.toUpperCase()}</Text>
            </Pressable>
            {news.map((n, i) => (
              <Pressable
                key={n.id}
                onPress={() => router.push({ pathname: '/article', params: { id: String(n.id) } })}
                style={({ hovered }: { hovered?: boolean }) => [styles.newsRow, i === news.length - 1 && { borderBottomWidth: 0 }, hovered && { backgroundColor: Colors.card }]}
              >
                {n.image ? <Image source={{ uri: n.image }} style={styles.newsImg} resizeMode="cover" /> : null}
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={styles.newsKicker} numberOfLines={1}>{(n.kicker || n.competition || '').toUpperCase()}</Text>
                  <Text style={styles.newsHead} numberOfLines={3}>{n.headline}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: Colors.background },
  main: { flex: 1, alignItems: 'center', borderLeftWidth: 1, borderRightWidth: 1, borderColor: Colors.line },
  page: { flex: 1, overflow: 'hidden' },
  hidden: { display: 'none' },

  sidebar: { width: SIDEBAR_W, backgroundColor: Colors.background, justifyContent: 'space-between' },
  sideContent: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 16, gap: 26 },
  wordmark: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  logoMark: { width: 22, height: 24 },
  wordmarkText: { color: Colors.white, fontSize: 22, fontFamily: Fonts.wordmark, letterSpacing: -0.2 },
  nav: { borderTopWidth: 1, borderTopColor: Colors.line },
  navItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, paddingHorizontal: 10, marginHorizontal: -10,
    borderBottomWidth: 1, borderBottomColor: Colors.line,
  },
  navItemOn: { backgroundColor: Colors.primary, borderBottomColor: Colors.primary },
  navItemHover: { backgroundColor: Colors.card },
  navNum: { width: 18, color: Colors.textFaint, fontSize: 10, fontFamily: Fonts.mono },
  navLabel: { ...displayType(24, 28), flex: 1, color: Colors.textSecondary },
  navTextOn: { color: Colors.black },
  navLive: { paddingRight: 2 },
  links: { gap: 2 },
  link: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  linkText: { flexShrink: 1, color: Colors.textMuted, fontSize: 13, fontFamily: Fonts.label, letterSpacing: 0.5 },
  linkBadge: { backgroundColor: Colors.primary, color: Colors.black, fontSize: 10, fontFamily: Fonts.monoBold, paddingHorizontal: 5, paddingVertical: 1 },
  sideFoot: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 18, gap: 12, borderTopWidth: 1, borderTopColor: Colors.line },
  me: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  initial: { width: 40, height: 40, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  initialText: { color: Colors.black, fontSize: 22, fontFamily: Fonts.display },
  meTop: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  meName: { ...displayType(16, 19), flexShrink: 1, color: Colors.white },
  meTier: { color: Colors.primary, fontSize: 9, fontFamily: Fonts.monoBold, letterSpacing: 0.6 },
  signOut: { color: Colors.textMuted, fontSize: 10, fontFamily: Fonts.monoBold, letterSpacing: 0.8, textDecorationLine: 'underline' },
  signIn: { backgroundColor: Colors.primary, paddingVertical: 11, paddingHorizontal: 12 },
  signInText: { color: Colors.black, fontSize: 14, fontFamily: Fonts.label, letterSpacing: 0.4 },
  responsible: { color: Colors.textFaint, fontSize: 9, fontFamily: Fonts.mono, letterSpacing: 0.4 },

  rail: { width: RAIL_W, backgroundColor: Colors.background },
  railContent: { padding: 18, gap: 14 },
  betina: { height: 220, backgroundColor: Colors.card, overflow: 'hidden' },
  betinaPhoto: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
  betinaShade: { ...StyleSheet.absoluteFill, backgroundColor: Colors.overlay },
  betinaText: { position: 'absolute', left: 14, bottom: 12, gap: 2 },
  online: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  onlineText: { color: Colors.primary, fontSize: 10, fontFamily: Fonts.monoBold, letterSpacing: 1 },
  betinaName: { ...displayType(44, 46), color: Colors.white },
  ask: {
    flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderColor: Colors.borderStrong,
    paddingVertical: 12, paddingHorizontal: 14,
  },
  askHover: { borderColor: Colors.primary },
  askText: { flex: 1, color: Colors.textMuted, fontSize: 14, fontFamily: Fonts.regular },
  askArrow: { color: Colors.primary, fontSize: 18, fontFamily: Fonts.bold },
  liveBox: { borderWidth: 1, borderColor: Colors.line },
  liveHead: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: Colors.line },
  liveTitle: { ...displayType(20, 24), color: Colors.white },
  liveCount: { marginLeft: 'auto', color: Colors.live, fontSize: 10, fontFamily: Fonts.monoBold, letterSpacing: 0.8 },
  liveMore: { paddingVertical: 11, alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.line },
  newsBox: { borderWidth: 1, borderColor: Colors.line },
  newsRow: { flexDirection: 'row', gap: 10, padding: 12, borderBottomWidth: 1, borderBottomColor: Colors.line },
  newsImg: { width: 64, height: 64, backgroundColor: Colors.card },
  newsKicker: { color: Colors.primary, fontSize: 9, fontFamily: Fonts.monoBold, letterSpacing: 0.8 },
  newsHead: { color: Colors.white, fontSize: 14, lineHeight: 18, fontFamily: Fonts.label },
  liveMoreText: { color: Colors.primary, fontSize: 12, fontFamily: Fonts.label, letterSpacing: 0.6 },
});
