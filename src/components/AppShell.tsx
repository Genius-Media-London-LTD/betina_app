// The app's main frame: full-screen pages you swipe left/right, a header with
// the page names gliding along under a neon indicator, and a side menu that
// slides in from the right. The pages are plain components (src/screens);
// the (tabs) routes only say which page is active, so deep links and push
// targets like "/tippspiel" keep working.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  Extrapolation, FadeIn, FadeInRight, SharedValue, SlideInRight,
  interpolate, interpolateColor, runOnJS, useAnimatedRef, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue,
} from 'react-native-reanimated';
import BETinaAvatar from './BETinaAvatar';
import { ChromeContext } from './chrome';
import { useI18n } from '../lib/i18n';
import ChatScreen from '../screens/ChatScreen';
import HomeScreen from '../screens/HomeScreen';
import JourneyScreen from '../screens/JourneyScreen';
import NewsScreen from '../screens/NewsScreen';
import TippspielScreen from '../screens/TippspielScreen';
import { Colors, Fonts, Typography, withAlpha } from '../theme';

type Labels = ReturnType<typeof useI18n>['t'];
type PageDef = { key: string; route: string; path: string; label: keyof Labels; emoji: string; Component: React.ComponentType };

const PAGES: PageDef[] = [
  { key: 'home', route: '/(tabs)', path: '/', label: 'tabHome', emoji: '🏠', Component: HomeScreen },
  { key: 'news', route: '/(tabs)/live', path: '/live', label: 'tabNews', emoji: '📰', Component: NewsScreen },
  { key: 'tipps', route: '/(tabs)/tippspiel', path: '/tippspiel', label: 'tabTipps', emoji: '🎯', Component: TippspielScreen },
  { key: 'chat', route: '/(tabs)/chat', path: '/chat', label: 'tabChat', emoji: '💬', Component: ChatScreen },
  { key: 'journey', route: '/(tabs)/journey', path: '/journey', label: 'tabJourney', emoji: '🚀', Component: JourneyScreen },
];

const MORE: { emoji: string; label: keyof Labels; href: string }[] = [
  { emoji: '🔔', label: 'notifTitle', href: '/notifications' },
  { emoji: '⚙️', label: 'settingsTitle', href: '/settings' },
  { emoji: '🌍', label: 'settingsLanguage', href: '/language' },
  { emoji: '🛡️', label: 'settingsResponsible', href: '/responsible-gaming' },
  { emoji: '❓', label: 'settingsHelp', href: '/help' },
  { emoji: '📄', label: 'settingsTermsPrivacy', href: '/legal' },
];

const HEADER = 54;
const STEP = 96; // distance between page names in the header strip

export default function AppShell() {
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
  const [menu, setMenu] = useState(false);
  const progress = useSharedValue(routeIndex);
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const settleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const headerHeight = insets.top + HEADER;

  const show = useCallback((i: number) => {
    activeRef.current = i;
    setActive(i);
    setMounted((m) => (m.includes(i - 1) && m.includes(i) && m.includes(i + 1) ? m : [...new Set([...m, i - 1, i, i + 1])]));
  }, []);

  const scrollTo = useCallback((i: number, animated: boolean) => {
    scrollRef.current?.scrollTo({ x: i * width, y: 0, animated });
  }, [scrollRef, width]);

  /** Jump to a page from the header strip or the menu. */
  const goTo = useCallback((i: number) => {
    Haptics.selectionAsync();
    setMenu(false);
    if (i !== activeRef.current) {
      show(i);
      router.navigate(PAGES[i].route as never);
    }
    scrollTo(i, true);
  }, [router, scrollTo, show]);

  // Route → page (deep links, pushes, router.push('/(tabs)/chat') elsewhere).
  useEffect(() => {
    if (routeIndex !== activeRef.current) {
      show(routeIndex);
      scrollTo(routeIndex, true);
    }
  }, [routeIndex, scrollTo, show]);

  // Keep the visible page in place when the width changes (web resize, rotation).
  useEffect(() => { scrollTo(activeRef.current, false); }, [width, scrollTo]);

  /** A swipe came to rest on page x / width. */
  const settle = useCallback((x: number) => {
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
    <ChromeContext.Provider value={{ top: headerHeight, bottom: insets.bottom }}>
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
          contentOffset={{ x: routeIndex * width, y: 0 }}
          onLayout={() => scrollTo(activeRef.current, false)}
        >
          {PAGES.map((p, i) => (
            <PageFrame key={p.key} index={i} progress={progress} width={width} height={height}>
              {mounted.includes(i) ? <p.Component /> : null}
            </PageFrame>
          ))}
        </Animated.ScrollView>

        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top, height: headerHeight }]} pointerEvents="box-none">
          <LinearGradient
            colors={[Colors.background, withAlpha(Colors.background, 0.92), withAlpha(Colors.background, 0)]}
            locations={[0, 0.7, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <IconButton onPress={() => router.push('/notifications')} label="🔔" dot />
          <PageStrip progress={progress} labels={PAGES.map((p) => String(t[p.label]))} onPress={goTo} />
          <IconButton onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setMenu(true); }} label="☰" />
        </View>

        <SideMenu
          open={menu}
          active={active}
          onClose={() => setMenu(false)}
          onPage={goTo}
          onLink={(href) => { setMenu(false); router.push(href as never); }}
          t={t}
          insetsTop={insets.top}
          insetsBottom={insets.bottom}
          width={width}
        />
      </View>
    </ChromeContext.Provider>
  );
}

/** One page; off-centre pages shrink and dim a little while you swipe. */
function PageFrame({ index, progress, width, height, children }: { index: number; progress: SharedValue<number>; width: number; height: number; children: React.ReactNode }) {
  const style = useAnimatedStyle(() => {
    const d = Math.abs(progress.value - index);
    return {
      opacity: interpolate(d, [0, 1], [1, 0.5], Extrapolation.CLAMP),
      borderRadius: interpolate(d, [0, 1], [0, 28], Extrapolation.CLAMP),
      transform: [{ scale: interpolate(d, [0, 1], [1, 0.92], Extrapolation.CLAMP) }],
    };
  });
  return (
    <Animated.View style={[{ width, height, overflow: 'hidden', backgroundColor: Colors.background }, style]}>
      {children}
    </Animated.View>
  );
}

/** Page names gliding past a fixed neon indicator that stretches mid-swipe. */
function PageStrip({ progress, labels, onPress }: { progress: SharedValue<number>; labels: string[]; onPress: (i: number) => void }) {
  const bar = useAnimatedStyle(() => {
    const f = progress.value - Math.floor(progress.value);
    const stretch = 1 - Math.abs(f * 2 - 1);
    return { width: 22 + stretch * 46, opacity: 1 - stretch * 0.35 };
  });
  return (
    <View style={styles.strip}>
      {labels.map((label, i) => (
        <StripLabel key={label + i} label={label} index={i} progress={progress} onPress={() => onPress(i)} />
      ))}
      <LinearGradient colors={[Colors.background, withAlpha(Colors.background, 0)]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={[styles.fade, { left: 0 }]} pointerEvents="none" />
      <LinearGradient colors={[withAlpha(Colors.background, 0), Colors.background]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={[styles.fade, { right: 0 }]} pointerEvents="none" />
      <Animated.View style={[styles.indicator, bar]} pointerEvents="none" />
    </View>
  );
}

function StripLabel({ label, index, progress, onPress }: { label: string; index: number; progress: SharedValue<number>; onPress: () => void }) {
  const style = useAnimatedStyle(() => {
    const d = index - progress.value;
    const a = Math.abs(d);
    return {
      opacity: interpolate(a, [0, 1, 2], [1, 0.45, 0], Extrapolation.CLAMP),
      transform: [
        { translateX: d * STEP },
        { scale: interpolate(a, [0, 1], [1, 0.84], Extrapolation.CLAMP) },
      ],
    };
  });
  const text = useAnimatedStyle(() => ({
    color: interpolateColor(Math.min(Math.abs(index - progress.value), 1), [0, 1], [Colors.textPrimary, Colors.textSecondary]),
  }));
  return (
    <Animated.View style={[styles.labelBox, style]}>
      <Pressable onPress={onPress} hitSlop={6} style={styles.labelPress}>
        <Animated.Text style={[styles.label, text]} numberOfLines={1}>{label.toUpperCase()}</Animated.Text>
      </Pressable>
    </Animated.View>
  );
}

function IconButton({ label, onPress, dot }: { label: string; onPress: () => void; dot?: boolean }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}>
      <Text style={styles.iconText}>{label}</Text>
      {dot && <View style={styles.dot} />}
    </Pressable>
  );
}

function SideMenu({
  open, active, onClose, onPage, onLink, t, insetsTop, insetsBottom, width,
}: {
  open: boolean; active: number; onClose: () => void; onPage: (i: number) => void; onLink: (href: string) => void;
  t: Labels; insetsTop: number; insetsBottom: number; width: number;
}) {
  if (!open) return null;
  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(180)} style={[StyleSheet.absoluteFill, styles.backdrop]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View
        entering={SlideInRight.duration(280)}
        style={[styles.drawer, { width: Math.min(330, width * 0.84), paddingTop: insetsTop + 14, paddingBottom: insetsBottom + 18 }]}
      >
        <View style={styles.drawerHead}>
          <BETinaAvatar size={40} online />
          <Text style={styles.drawerTitle}>{String(t.tabMenu).toUpperCase()}</Text>
          <Pressable onPress={onClose} hitSlop={10} style={styles.iconBtn}>
            <Text style={styles.iconText}>✕</Text>
          </Pressable>
        </View>
        <View style={styles.neonLine} />

        {PAGES.map((p, i) => (
          <Animated.View key={p.key} entering={FadeInRight.delay(60 + i * 45).duration(300)}>
            <Pressable onPress={() => onPage(i)} style={({ pressed }) => [styles.row, i === active && styles.rowActive, pressed && styles.rowPressed]}>
              {i === active && <View style={styles.rowMark} />}
              <Text style={styles.rowEmoji}>{p.emoji}</Text>
              <Text style={[styles.rowLabel, i === active && styles.rowLabelActive]}>{String(t[p.label])}</Text>
            </Pressable>
          </Animated.View>
        ))}

        <View style={styles.divider} />

        {MORE.map((m, i) => (
          <Animated.View key={m.href} entering={FadeInRight.delay(300 + i * 35).duration(280)}>
            <Pressable onPress={() => onLink(m.href)} style={({ pressed }) => [styles.rowSmall, pressed && styles.rowPressed]}>
              <Text style={styles.rowEmojiSmall}>{m.emoji}</Text>
              <Text style={styles.rowLabelSmall}>{String(t[m.label])}</Text>
            </Pressable>
          </Animated.View>
        ))}

        <View style={{ flex: 1 }} />
        <Text style={styles.footer}>BETina · GeniusBet</Text>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: withAlpha(Colors.white, 0.04), borderWidth: 1, borderColor: Colors.glassBorder,
  },
  iconBtnPressed: { borderColor: Colors.primary, backgroundColor: Colors.glowGreen },
  iconText: { color: Colors.textPrimary, fontSize: Typography.md, fontFamily: Fonts.bold },
  dot: {
    position: 'absolute', top: 7, right: 8, width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.primary, borderWidth: 1.5, borderColor: Colors.background,
  },
  strip: { flex: 1, height: 44, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  labelBox: { position: 'absolute', width: STEP, alignItems: 'center' },
  labelPress: { paddingVertical: 8, paddingHorizontal: 4 },
  label: { fontSize: Typography.sm, fontFamily: Fonts.blackItalic, letterSpacing: 1.4 },
  fade: { position: 'absolute', top: 0, bottom: 0, width: 36 },
  indicator: {
    position: 'absolute', bottom: 4, height: 3, borderRadius: 2, backgroundColor: Colors.primary,
    shadowColor: Colors.primary, shadowOpacity: 0.9, shadowRadius: 8, shadowOffset: { width: 0, height: 0 },
  },
  backdrop: { backgroundColor: withAlpha(Colors.black, 0.6) },
  drawer: {
    position: 'absolute', top: 0, bottom: 0, right: 0, paddingHorizontal: 18,
    backgroundColor: Colors.surface, borderLeftWidth: 1, borderLeftColor: withAlpha(Colors.primary, 0.35),
  },
  drawerHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  drawerTitle: { flex: 1, color: Colors.textPrimary, fontSize: Typography.lg, fontFamily: Fonts.blackItalic, letterSpacing: 2 },
  neonLine: {
    height: 2, marginTop: 16, marginBottom: 10, borderRadius: 1, backgroundColor: Colors.primary,
    shadowColor: Colors.primary, shadowOpacity: 0.9, shadowRadius: 10, shadowOffset: { width: 0, height: 0 },
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 13, paddingHorizontal: 12, borderRadius: 12 },
  rowActive: { backgroundColor: Colors.glowGreen },
  rowPressed: { backgroundColor: withAlpha(Colors.white, 0.06) },
  rowMark: {
    position: 'absolute', left: 0, top: 10, bottom: 10, width: 3, borderRadius: 2, backgroundColor: Colors.primary,
    shadowColor: Colors.primary, shadowOpacity: 0.9, shadowRadius: 6, shadowOffset: { width: 0, height: 0 },
  },
  rowEmoji: { fontSize: 20, width: 28, textAlign: 'center' },
  rowLabel: { color: Colors.textSecondary, fontSize: Typography.md, fontFamily: Fonts.extrabold, textTransform: 'uppercase', letterSpacing: 1 },
  rowLabelActive: { color: Colors.textPrimary },
  divider: { height: 1, backgroundColor: Colors.glassBorder, marginVertical: 12 },
  rowSmall: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10 },
  rowEmojiSmall: { fontSize: 16, width: 28, textAlign: 'center' },
  rowLabelSmall: { color: Colors.textSecondary, fontSize: Typography.base, fontFamily: Fonts.semibold },
  footer: { color: Colors.textMuted, fontSize: Typography.xs, fontFamily: Fonts.bold, letterSpacing: 2, textAlign: 'center' },
});
