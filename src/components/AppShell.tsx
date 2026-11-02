// The app's main frame (urban design): a black header with the BETINA
// wordmark, bell and lime menu button, numbered page tabs with a lime
// underline that travels with your swipe, full-screen pages you swipe
// left/right, and the full-screen lime menu. Pages are plain components
// (src/screens); the (tabs) routes only say which page is active, so deep
// links and push targets like "/tippspiel" keep working.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useFocusEffect, usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
  Extrapolation, FadeIn, FadeInDown, SharedValue,
  interpolate, interpolateColor, runOnJS, useAnimatedRef, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue,
} from 'react-native-reanimated';
import { ChromeContext } from './chrome';
import DesktopShell from './DesktopShell';
import XPBar from './XPBar';
import GoalFlash from './live/GoalFlash';
import { useProfile } from '../hooks/useProfile';
import { LANGUAGES, useI18n } from '../lib/i18n';
import { useIsAdmin } from '../lib/admin';
import { tiers } from '../lib/demo';
import { signOut } from '../lib/session';
import { useDesktop } from '../lib/layout';
import { supabase } from '../lib/supabase';
import ChatScreen from '../screens/ChatScreen';
import HomeScreen from '../screens/HomeScreen';
import JourneyScreen from '../screens/JourneyScreen';
import LiveScreen from '../screens/LiveScreen';
import NewsScreen from '../screens/NewsScreen';
import TippspielScreen from '../screens/TippspielScreen';
import { Colors, Fonts, displayType } from '../theme';

type Labels = ReturnType<typeof useI18n>['t'];
type PageDef = { key: string; route: string; path: string; label: (t: Labels) => string; Component: React.ComponentType };

const PAGES: PageDef[] = [
  { key: 'home', route: '/(tabs)', path: '/', label: (t) => t.tabHome, Component: HomeScreen },
  { key: 'scores', route: '/(tabs)/scores', path: '/scores', label: (t) => t.tabLive, Component: LiveScreen },
  { key: 'news', route: '/(tabs)/live', path: '/live', label: (t) => t.tabNews, Component: NewsScreen },
  { key: 'tipps', route: '/(tabs)/tippspiel', path: '/tippspiel', label: (t) => t.tabTipps, Component: TippspielScreen },
  { key: 'chat', route: '/(tabs)/chat', path: '/chat', label: () => 'BETina', Component: ChatScreen },
  { key: 'journey', route: '/(tabs)/journey', path: '/journey', label: (t) => t.tabJourney, Component: JourneyScreen },
];

const BAR = 50;   // logo row
const TABS = 42;  // numbered tab row

/** Phone pager, or the sidebar frame on a desktop browser. */
export default function AppShell() {
  return useDesktop() ? <DesktopShell pages={PAGES} /> : <PhoneShell />;
}

function PhoneShell() {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const routeIndex = Math.max(0, PAGES.findIndex((p) => p.path === pathname));
  const [active, setActive] = useState(routeIndex);
  const activeRef = useRef(routeIndex);
  // Pages mount when they are (next to) the visible one and then stay mounted.
  const [mounted, setMounted] = useState<number[]>(() => [routeIndex - 1, routeIndex, routeIndex + 1]);
  // Where the pager starts. Only the first value counts: a contentOffset that
  // follows the route got re-applied on every re-render (Android), which
  // flashed the previous page during a jump before the route caught up.
  const [startOffset] = useState(() => ({ x: routeIndex * width, y: 0 }));
  const [menu, setMenu] = useState(false);
  const [unread, setUnread] = useState(0);
  const progress = useSharedValue(routeIndex);
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const settleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const headerHeight = insets.top + BAR + TABS;

  // Unread badge on the bell (guests: none).
  useFocusEffect(useCallback(() => {
    supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('read', false)
      .then(({ count }) => setUnread(count ?? 0));
  }, []));

  const show = useCallback((i: number) => {
    activeRef.current = i;
    setActive(i);
    setMounted((m) => (m.includes(i - 1) && m.includes(i) && m.includes(i + 1) ? m : [...new Set([...m, i - 1, i, i + 1])]));
  }, []);

  const scrollTo = useCallback((i: number, animated: boolean) => {
    scrollRef.current?.scrollTo({ x: i * width, y: 0, animated });
  }, [scrollRef, width]);

  // A jump from a tab, the menu or the logo. The pager mustn't take the scroll
  // it causes for a swipe — an animated jump across several pages (paging on
  // Android in particular) could come to rest a page too far. So: neighbours
  // slide, farther pages switch at once, and swipe handling waits meanwhile.
  const jumping = useRef(false);
  const jumpTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const jump = useCallback((i: number, from: number) => {
    const slide = Math.abs(i - from) === 1;
    jumping.current = true;
    clearTimeout(jumpTimer.current);
    jumpTimer.current = setTimeout(() => {
      jumping.current = false;
      scrollTo(activeRef.current, false); // wherever it ended: the chosen page
    }, slide ? 600 : 150);
    if (!slide) progress.value = i;
    scrollTo(i, slide);
  }, [progress, scrollTo]);

  /** Jump to a page from the tabs, the menu or the logo. */
  const goTo = useCallback((i: number) => {
    Haptics.selectionAsync();
    setMenu(false);
    const from = activeRef.current;
    if (i !== from) {
      show(i);
      router.navigate(PAGES[i].route as never);
    }
    jump(i, from);
  }, [router, jump, show]);

  // Route → page (deep links, pushes, router.push('/(tabs)/chat') elsewhere).
  useEffect(() => {
    const from = activeRef.current;
    if (routeIndex !== from) {
      show(routeIndex);
      jump(routeIndex, from);
    }
  }, [routeIndex, jump, show]);

  // Keep the visible page in place when the width changes (web resize, rotation).
  useEffect(() => { scrollTo(activeRef.current, false); }, [width, scrollTo]);

  /** A swipe came to rest on page x / width. */
  const settle = useCallback((x: number) => {
    if (jumping.current) return;
    const i = Math.max(0, Math.min(PAGES.length - 1, Math.round(x / width)));
    if (i === activeRef.current) return;
    show(i);
    Haptics.selectionAsync();
    router.navigate(PAGES[i].route as never);
  }, [router, show, width]);

  // Native reports the end of a fling; the web has no momentum events, so it
  // waits for the scroll to go quiet.
  const settleSoon = useCallback((x: number) => {
    clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => settle(x), 120);
  }, [settle]);

  const isWeb = Platform.OS === 'web';
  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      progress.value = e.contentOffset.x / width;
      if (isWeb) runOnJS(settleSoon)(e.contentOffset.x);
    },
    onMomentumEnd: (e) => {
      runOnJS(settle)(e.contentOffset.x);
    },
  });

  return (
    <ChromeContext.Provider value={{ top: headerHeight, bottom: insets.bottom, page: PAGES[active]?.key }}>
      <View style={styles.root}>
        <Animated.ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          bounces={false}
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
          contentOffset={startOffset}
          onLayout={() => scrollTo(activeRef.current, false)}
        >
          {PAGES.map((p, i) => (
            <PageFrame key={p.key} index={i} progress={progress} width={width} height={height}>
              {mounted.includes(i) ? <p.Component /> : null}
            </PageFrame>
          ))}
        </Animated.ScrollView>

        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <View style={styles.bar}>
            <Pressable onPress={() => goTo(0)} hitSlop={8} accessibilityRole="button" accessibilityLabel="BETina home">
              <Wordmark />
            </Pressable>
            <View style={styles.barRight}>
              <Pressable onPress={() => router.push('/notifications')} hitSlop={6} style={({ pressed }) => [styles.bell, pressed && styles.pressed]}>
                <Text style={styles.bellIcon}>🔔</Text>
                {unread > 0 && (
                  <View style={styles.badge}><Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text></View>
                )}
              </Pressable>
              <MenuButton onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setMenu(true); }} />
            </View>
          </View>
          <TabRow progress={progress} active={active} labels={PAGES.map((p) => p.label(t))} onPress={goTo} />
        </View>

        <FullMenu
          open={menu}
          active={active}
          unread={unread}
          onClose={() => setMenu(false)}
          onPage={goTo}
          onLink={(href) => { setMenu(false); router.push(href as never); }}
          onSignOut={async () => { setMenu(false); await signOut(); router.replace('/(auth)/login'); }}
          insetsTop={insets.top}
          insetsBottom={insets.bottom}
        />
        <GoalFlash />
      </View>
    </ChromeContext.Provider>
  );
}

/** One page; the outgoing page dims and shrinks a touch while you swipe. */
function PageFrame({ index, progress, width, height, children }: { index: number; progress: SharedValue<number>; width: number; height: number; children: React.ReactNode }) {
  const style = useAnimatedStyle(() => {
    const d = Math.abs(progress.value - index);
    return {
      opacity: interpolate(d, [0, 1], [1, 0.35], Extrapolation.CLAMP),
      transform: [{ scale: interpolate(d, [0, 1], [1, 0.94], Extrapolation.CLAMP) }],
    };
  });
  return <Animated.View style={[{ width, height, overflow: 'hidden', backgroundColor: Colors.background }, style]}>{children}</Animated.View>;
}

/** "BET" white + "INA" lime, with the GeniusBet mark. */
function Wordmark() {
  return (
    <View style={styles.wordmark}>
      <Image source={require('../../assets/urban/logo-mark.png')} style={styles.logoMark} resizeMode="contain" />
      <Text style={styles.wordmarkText}>BET<Text style={{ color: Colors.primary }}>INA</Text></Text>
    </View>
  );
}

/** Lime square with three black bars (20 / 14 / 20, right-aligned). */
function MenuButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={6} style={({ pressed }) => [styles.menuBtn, pressed && { backgroundColor: Colors.primaryDim }]} accessibilityLabel="Menu">
      <View style={[styles.menuBar, { width: 20 }]} />
      <View style={[styles.menuBar, { width: 14 }]} />
      <View style={[styles.menuBar, { width: 20 }]} />
    </Pressable>
  );
}

/** Numbered page tabs; the lime underline travels with the pager. */
function TabRow({ progress, active, labels, onPress }: { progress: SharedValue<number>; active: number; labels: string[]; onPress: (i: number) => void }) {
  const [layouts, setLayouts] = useState<{ x: number; w: number }[]>([]);
  const rowRef = useRef<ScrollView>(null);
  const ready = layouts.length === labels.length && layouts.every(Boolean);

  // Keep the active tab centred when the row is wider than the screen.
  const { width: screenW } = useWindowDimensions();
  useEffect(() => {
    const l = layouts[active];
    if (l) rowRef.current?.scrollTo({ x: Math.max(0, l.x + l.w / 2 - screenW / 2), animated: true });
  }, [active, layouts, screenW]);

  const xs = layouts.map((l) => l?.x ?? 0);
  const ws = layouts.map((l) => l?.w ?? 0);
  const idx = labels.map((_, i) => i);
  const underline = useAnimatedStyle(() => {
    if (!ready) return { opacity: 0 };
    return {
      opacity: 1,
      left: interpolate(progress.value, idx, xs, Extrapolation.CLAMP),
      width: interpolate(progress.value, idx, ws, Extrapolation.CLAMP),
    };
  });

  return (
    <ScrollView ref={rowRef} horizontal showsHorizontalScrollIndicator={false} style={styles.tabRow} contentContainerStyle={styles.tabRowContent}>
      {labels.map((label, i) => (
        <Tab
          key={i}
          index={i}
          label={label}
          progress={progress}
          onPress={() => onPress(i)}
          onLayout={(x, w) => setLayouts((prev) => {
            const next = [...prev];
            next[i] = { x, w };
            return next;
          })}
        />
      ))}
      <Animated.View style={[styles.underline, underline]} pointerEvents="none" />
    </ScrollView>
  );
}

function Tab({ index, label, progress, onPress, onLayout }: {
  index: number; label: string; progress: SharedValue<number>; onPress: () => void; onLayout: (x: number, w: number) => void;
}) {
  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(Math.min(Math.abs(index - progress.value), 1), [0, 1], [Colors.white, Colors.textFaint]),
  }));
  const numStyle = useAnimatedStyle(() => ({
    color: interpolateColor(Math.min(Math.abs(index - progress.value), 1), [0, 1], [Colors.primary, Colors.textFaint]),
  }));
  return (
    <Pressable onPress={onPress} onLayout={(e) => onLayout(e.nativeEvent.layout.x, e.nativeEvent.layout.width)} style={styles.tab}>
      <Animated.Text style={[styles.tabNum, numStyle]}>{String(index + 1).padStart(2, '0')}</Animated.Text>
      <Animated.Text style={[styles.tabLabel, labelStyle]} numberOfLines={1}>{label.toUpperCase()}</Animated.Text>
    </Pressable>
  );
}

/** Full-screen lime menu (design 04). */
function FullMenu({
  open, active, unread, onClose, onPage, onLink, onSignOut, insetsTop, insetsBottom,
}: {
  open: boolean; active: number; unread: number; onClose: () => void; onPage: (i: number) => void;
  onLink: (href: string) => void; onSignOut: () => void; insetsTop: number; insetsBottom: number;
}) {
  const { t, lang } = useI18n();
  const { profile } = useProfile();
  const admin = useIsAdmin();
  const { width } = useWindowDimensions();
  if (!open) return null;

  const name = (profile?.name ?? '').trim();
  const xp = profile?.xp_points ?? 0;
  const tierName = profile?.vip_tier ?? 'INITIATE';
  const ti = Math.max(0, tiers.findIndex((x) => x.name === tierName));
  const next = tiers[ti + 1] ?? null;
  const progress = next ? (xp - tiers[ti].minXp) / (next.minXp - tiers[ti].minXp) : 1;
  const num = new Intl.NumberFormat(lang === 'en' ? 'en-GB' : lang);
  const xpLine = next
    ? `${num.format(xp)} / ${num.format(next.minXp)} XP · ${t.menuXpToNext.replace('{n}', num.format(next.minXp - xp)).replace('{tier}', next.name)}`
    : `${num.format(xp)} XP · ${t.menuMaxTier}`;

  // Pages by key, so adding a page never shifts the menu.
  const pageOf = (key: string) => PAGES.findIndex((p) => p.key === key);
  const items: { label: string; badge?: string; page?: number; href?: string }[] = [
    { label: t.tabHome, page: pageOf('home') },
    { label: t.tabLive, page: pageOf('scores'), badge: 'LIVE' },
    { label: t.tabNews, page: pageOf('news') },
    { label: t.tabTipps, page: pageOf('tipps') },
    { label: `BETina ${t.tabChat}`, page: pageOf('chat'), badge: 'ONLINE' },
    { label: t.tabJourney, page: pageOf('journey'), badge: tierName },
    { label: t.notifTitle, href: '/notifications', badge: unread > 0 ? String(unread) : undefined },
    { label: t.tiersTitle, href: '/tiers' },
    { label: t.settingsTitle, href: '/settings' },
    { label: t.settingsHelp, href: '/help' },
    ...(admin ? [{ label: 'Team dashboard', href: '/admin' }] : []),
  ];
  // One size for every item, so the longest one fits (Anton runs about half an
  // em wide). Shrinking only the long rows made some — like 06 with its tier
  // badge — look broken next to the others.
  const longest = Math.max(...items.map((it) => it.label.length + (it.badge ? it.badge.length * 0.6 + 2 : 0)));
  const labelSize = Math.max(24, Math.min(38, Math.floor((width - 36 - 32) / (longest * 0.5))));
  const quick = [
    { k: t.settingsLanguage, v: LANGUAGES.find((l) => l.code === lang)?.nativeName ?? lang, href: '/language' },
    { k: t.menuTeam, v: profile?.favourite_team ?? '—', href: '/settings' },
    { k: t.menuStreak, v: `${profile?.streak_days ?? 0} ${t.menuDaysActive}`, page: pageOf('journey') },
    { k: 'XP', v: num.format(xp), page: pageOf('journey') },
  ];

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(160)} style={[StyleSheet.absoluteFill, styles.menu]}>
        <ScrollView contentContainerStyle={[styles.menuContent, { paddingTop: insetsTop + 14, paddingBottom: insetsBottom + 28 }]} showsVerticalScrollIndicator={false}>
          <View style={styles.menuHead}>
            <View style={styles.menuTitleRow}>
              <Text style={styles.menuTitle}>BETINA</Text>
              <Text style={styles.menuSub}>/ {t.tabMenu.toUpperCase()}</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.menuClose} accessibilityLabel="Close">
              <Text style={styles.menuCloseText}>✕</Text>
            </Pressable>
          </View>

          {profile && (
            <Animated.View entering={FadeInDown.delay(40).duration(260)} style={styles.profile}>
              <View style={styles.initial}><Text style={styles.initialText}>{(name[0] ?? 'B').toUpperCase()}</Text></View>
              <View style={{ flex: 1, gap: 6, minWidth: 0 }}>
                <View style={styles.profileTop}>
                  <Text style={styles.profileName} numberOfLines={1}>{name.toUpperCase() || 'BETINA'}</Text>
                  <Text style={styles.tierSticker}>{tierName}</Text>
                </View>
                <XPBar progress={progress} height={6} delay={150} />
                <Text style={styles.xpLine} numberOfLines={1}>{xpLine.toUpperCase()}</Text>
              </View>
            </Animated.View>
          )}

          <View style={styles.items}>
            {items.map((it, i) => {
              const on = it.page === active;
              return (
                <Animated.View key={it.label} entering={FadeInDown.delay(70 + i * 35).duration(240)}>
                  <Pressable
                    onPress={() => (it.page != null ? onPage(it.page) : onLink(it.href!))}
                    style={({ pressed }) => [styles.item, (on || pressed) && styles.itemOn]}
                  >
                    {({ pressed }) => (
                      <>
                        <Text style={[styles.itemNum, (on || pressed) && styles.itemTextOn]}>{String(i + 1).padStart(2, '0')}</Text>
                        <Text style={[styles.itemLabel, displayType(labelSize, labelSize + 4), (on || pressed) && styles.itemTextOn]} numberOfLines={1}>
                          {it.label.toUpperCase()}
                        </Text>
                        {it.badge && (
                          <Text style={[styles.itemBadge, (on || pressed) && styles.itemBadgeOn]}>{it.badge}</Text>
                        )}
                      </>
                    )}
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>

          <View style={styles.quick}>
            {quick.map((q) => (
              <Pressable
                key={q.k}
                onPress={() => (q.page != null ? onPage(q.page) : onLink(q.href!))}
                style={({ pressed }) => [styles.quickTile, pressed && styles.itemOn]}
              >
                {({ pressed }) => (
                  <>
                    <Text style={[styles.quickKey, pressed && styles.itemTextOn]}>{q.k.toUpperCase()}</Text>
                    <Text style={[styles.quickVal, pressed && styles.itemTextOn]} numberOfLines={1}>{q.v}</Text>
                  </>
                )}
              </Pressable>
            ))}
          </View>

          <View style={styles.menuFoot}>
            <Pressable onPress={onSignOut} hitSlop={8}>
              <Text style={[styles.footText, styles.footLink]}>{t.settingsLogout.toUpperCase()}</Text>
            </Pressable>
            <Text style={styles.footText}>{t.menuResponsible}</Text>
          </View>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    position: 'absolute', top: 0, left: 0, right: 0,
    backgroundColor: Colors.background, borderBottomWidth: 1, borderBottomColor: Colors.line,
  },
  bar: { height: BAR, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  barRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  wordmark: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoMark: { width: 18, height: 20 },
  wordmarkText: { color: Colors.white, fontSize: 17, fontFamily: Fonts.wordmark, letterSpacing: -0.2 },
  pressed: { backgroundColor: Colors.cardElevated },
  bell: { width: 38, height: 38, borderWidth: 1.5, borderColor: Colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  bellIcon: { fontSize: 15 },
  badge: { position: 'absolute', top: -6, right: -6, backgroundColor: Colors.primary, paddingHorizontal: 4, paddingVertical: 1 },
  badgeText: { color: Colors.black, fontSize: 9, fontFamily: Fonts.monoBold },
  menuBtn: {
    width: 38, height: 38, backgroundColor: Colors.primary,
    alignItems: 'flex-end', justifyContent: 'center', gap: 5, paddingHorizontal: 9,
  },
  menuBar: { height: 2.5, backgroundColor: Colors.black },
  tabRow: { height: TABS, flexGrow: 0 },
  tabRowContent: { paddingHorizontal: 16, gap: 22, alignItems: 'stretch' },
  tab: { flexDirection: 'row', alignItems: 'baseline', gap: 6, paddingTop: 8, paddingBottom: 10 },
  tabNum: { fontSize: 10, fontFamily: Fonts.mono },
  tabLabel: { fontSize: 18, fontFamily: Fonts.label, letterSpacing: 0.4 },
  underline: { position: 'absolute', bottom: 0, height: 3, backgroundColor: Colors.primary },

  menu: { backgroundColor: Colors.primary },
  menuContent: { paddingHorizontal: 18, gap: 16 },
  menuHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  menuTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  menuTitle: { color: Colors.black, fontSize: 22, fontFamily: Fonts.display },
  menuSub: { color: Colors.black, fontSize: 10, fontFamily: Fonts.monoBold, letterSpacing: 1 },
  menuClose: { width: 38, height: 38, backgroundColor: Colors.black, alignItems: 'center', justifyContent: 'center' },
  menuCloseText: { color: Colors.primary, fontSize: 18, fontFamily: Fonts.bold },
  profile: { backgroundColor: Colors.black, padding: 12, flexDirection: 'row', gap: 12, alignItems: 'center' },
  initial: { width: 52, height: 52, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  initialText: { color: Colors.black, fontSize: 28, fontFamily: Fonts.display },
  profileTop: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
  profileName: { ...displayType(24, 26), flex: 1, color: Colors.white },
  tierSticker: {
    backgroundColor: Colors.primary, color: Colors.black, fontSize: 12, fontFamily: Fonts.label,
    paddingHorizontal: 6, paddingVertical: 2, letterSpacing: 0.7, transform: [{ rotate: '3deg' }],
  },
  xpLine: { color: Colors.primary, fontSize: 9, fontFamily: Fonts.mono, letterSpacing: 0.5 },
  items: { borderTopWidth: 2, borderTopColor: Colors.black },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 5, paddingHorizontal: 8, marginHorizontal: -8,
    borderBottomWidth: 2, borderBottomColor: Colors.black,
  },
  itemOn: { backgroundColor: Colors.black },
  itemNum: { width: 20, color: Colors.black, fontSize: 10, fontFamily: Fonts.monoBold },
  itemLabel: { ...displayType(38, 42), flex: 1, color: Colors.black },
  itemTextOn: { color: Colors.primary },
  itemBadge: {
    color: Colors.black, fontSize: 10, fontFamily: Fonts.monoBold, letterSpacing: 0.6,
    borderWidth: 1.5, borderColor: Colors.black, paddingHorizontal: 6, paddingVertical: 2,
  },
  itemBadgeOn: { color: Colors.primary, borderColor: Colors.primary },
  quick: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  quickTile: { width: '48.5%', borderWidth: 2, borderColor: Colors.black, paddingVertical: 9, paddingHorizontal: 10, gap: 2 },
  quickKey: { color: Colors.black, fontSize: 9, fontFamily: Fonts.monoBold, letterSpacing: 0.7 },
  quickVal: { color: Colors.black, fontSize: 15, fontFamily: Fonts.label },
  menuFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  footText: { color: Colors.black, fontSize: 10, fontFamily: Fonts.monoBold, letterSpacing: 0.8, flexShrink: 1, textAlign: 'right' },
  footLink: { textDecorationLine: 'underline', textAlign: 'left' },
});
