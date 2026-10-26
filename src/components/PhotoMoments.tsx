// BETina's photo moments (see src/lib/moments.ts for when they fire):
// K.O., Revanche, On Fire, Platz 1, Serie, Matchday — full screen with her
// photo, a big Anton headline and its own effect — plus the small TREFFER
// toast for 1–2 Tippspiel points. Points, XP and fun only.
import React, { useEffect, useRef } from 'react';
import { Dimensions, Image, ImageSourcePropType, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing, FadeIn, FadeInDown, FadeInUp, FadeOutUp, ZoomIn,
  useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSpring, withTiming,
} from 'react-native-reanimated';
import AnimatedNumber from './AnimatedNumber';
import { Confetti, withName } from './Moments';
import { Meta } from './Urban';
import { useI18n } from '../lib/i18n';
import type { HitMoment, PhotoMoment } from '../lib/moments';
import { Colors, Fonts, displayType } from '../theme';

const { width: W, height: H } = Dimensions.get('window');

const PHOTO: Record<PhotoMoment['kind'], ImageSourcePropType> = {
  ko: require('../../assets/urban/betina-login.jpg'),
  revanche: require('../../assets/urban/betina-wink.jpg'),
  fire: require('../../assets/urban/betina-hero.jpg'),
  lead: require('../../assets/urban/betina-ring.jpg'),
  streak: require('../../assets/urban/betina-smile.jpg'),
  matchday: require('../../assets/urban/betina-boxing.jpg'),
};

// ── Effects ──────────────────────────────────────────────────────────────────
const BURST = Array.from({ length: 24 }, (_, i) => {
  const angle = (i / 24) * Math.PI * 2 + (i % 3) * 0.35;
  const dist = 110 + ((i * 41) % 150);
  return { dx: Math.cos(angle) * dist, dy: Math.sin(angle) * dist, size: 6 + ((i * 7) % 12), white: i % 4 === 0, delay: (i % 5) * 40 };
});

function BurstPiece({ dx, dy, size, white, delay }: (typeof BURST)[number]) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(250 + delay, withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) }));
  }, [delay, p]);
  const style = useAnimatedStyle(() => ({
    opacity: 1 - p.value * 0.85,
    transform: [{ translateX: dx * p.value }, { translateY: dy * p.value }, { scale: 0.4 + p.value * 0.6 }],
  }));
  return <Animated.View style={[styles.abs, { width: size, height: size, backgroundColor: white ? Colors.white : Colors.primary }, style]} />;
}

/** Lime squares bursting out of the headline. */
function Burst() {
  return (
    <View style={styles.burst} pointerEvents="none">
      {BURST.map((p, i) => <BurstPiece key={i} {...p} />)}
    </View>
  );
}

const FLAMES = Array.from({ length: 22 }, (_, i) => ({
  x: ((i * 47) % 100) / 100,
  size: 8 + ((i * 5) % 14),
  delay: (i * 173) % 1600,
  duration: 1500 + ((i * 61) % 1200),
  color: [Colors.primary, Colors.warning, Colors.live, Colors.white][i % 4],
}));

function Flame({ x, size, delay, duration, color }: (typeof FLAMES)[number]) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(delay, withRepeat(withTiming(1, { duration, easing: Easing.out(Easing.quad) }), -1, false));
  }, [delay, duration, p]);
  const style = useAnimatedStyle(() => ({
    opacity: 1 - p.value,
    transform: [{ translateY: -p.value * H * 0.55 }, { translateX: Math.sin(p.value * 9) * 10 }, { scale: 1 - p.value * 0.6 }],
  }));
  return <Animated.View style={[styles.abs, { bottom: 0, left: x * W, width: size, height: size, backgroundColor: color }, style]} />;
}

/** Embers rising from the bottom of the screen. */
function Flames() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {FLAMES.map((f, i) => <Flame key={i} {...f} />)}
    </View>
  );
}

/** Diagonal ticker strip ("MATCHDAY · MATCHDAY · …"), slowly running. */
function Strip({ text }: { text: string }) {
  const x = useSharedValue(0);
  useEffect(() => {
    x.value = withRepeat(withTiming(-200, { duration: 6000, easing: Easing.linear }), -1, false);
  }, [x]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const line = Array.from({ length: 8 }, () => text.toUpperCase()).join(' · ');
  return (
    <View style={styles.strip}>
      <Animated.View style={[styles.stripRun, style]}>
        <Text style={styles.stripText} numberOfLines={1}>{line}</Text>
      </Animated.View>
    </View>
  );
}

/** The headline block that pops in with a spring (like BOOM). */
function Pop({ text, lime }: { text: string; lime?: boolean }) {
  // Anton is ~0.47em per capital: fit the line into the screen width.
  const size = Math.min(92, Math.floor((W - 64) / (text.length * 0.47)));
  const pop = useSharedValue(0);
  useEffect(() => {
    pop.value = withDelay(200, withSpring(1, { damping: 9, stiffness: 140 }));
  }, [pop]);
  const style = useAnimatedStyle(() => ({
    opacity: Math.min(1, pop.value * 1.5),
    transform: [{ scale: 0.3 + pop.value * 0.7 }, { rotate: `${-8 + pop.value * 5}deg` }],
  }));
  return (
    <Animated.View style={[lime ? styles.popLime : styles.popPlain, style]}>
      <Text style={[styles.popText, displayType(size, Math.round(size * 1.08)), lime && { color: Colors.black }]} numberOfLines={1} adjustsFontSizeToFit>
        {text.toUpperCase()}
      </Text>
    </Animated.View>
  );
}

// ── Full-screen moment ───────────────────────────────────────────────────────
type Btn = { label: string; onPress: () => void };

export default function PhotoMomentModal({ moment, name, onClose }: { moment: PhotoMoment | null; name: string; onClose: () => void }) {
  const { t, lang } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!moment) return;
    Haptics.notificationAsync(moment.kind === 'revanche' ? Haptics.NotificationFeedbackType.Warning : Haptics.NotificationFeedbackType.Success);
  }, [moment]);
  if (!moment) return null;

  const go = (path: Parameters<typeof router.push>[0]) => { onClose(); router.push(path); };
  const toChat: Btn = { label: t.momentTalk, onPress: () => go('/(tabs)/chat') };
  const toTipps: Btn = { label: t.tipBoomMore, onPress: () => go('/(tabs)/tippspiel') };
  const close = (label: string): Btn => ({ label, onPress: onClose });

  let tag = '';
  let body: React.ReactNode = null;
  let line = '';
  let primary: Btn = close(t.momentCelebrate);
  let secondary: Btn | null = null;
  let effect: React.ReactNode = null;

  if (moment.kind === 'ko' || moment.kind === 'revanche') {
    const ko = moment.kind === 'ko';
    tag = `${t.momentMatchday.replace('{n}', String(moment.matchday))} · ${moment.competition}`;
    body = (
      <>
        <Pop text={ko ? 'K.O.' : t.momentRevTitle} lime={ko} />
        <Animated.View entering={FadeInDown.delay(550).duration(400)} style={styles.duel}>
          <View style={styles.duelSide}>
            <Meta color={ko ? Colors.primary : Colors.textMuted}>{t.momentYou}</Meta>
            <AnimatedNumber value={moment.me} style={[styles.duelScore, { color: ko ? Colors.primary : Colors.white }]} delay={700} />
          </View>
          <Text style={styles.duelColon}>:</Text>
          <View style={[styles.duelSide, { alignItems: 'flex-end' }]}>
            <Meta color={ko ? Colors.textMuted : Colors.primary}>BETINA</Meta>
            <AnimatedNumber value={moment.betina} style={[styles.duelScore, { color: ko ? Colors.white : Colors.primary }]} delay={700} />
          </View>
        </Animated.View>
      </>
    );
    line = withName(ko ? t.momentKoLine : t.momentRevLine, name);
    if (ko) {
      effect = <Burst />;
      secondary = toChat;
    } else {
      primary = { label: t.momentRematch, onPress: () => go('/(tabs)/tippspiel') };
      secondary = toChat;
    }
  } else if (moment.kind === 'fire') {
    tag = 'BEAT BETINA';
    body = (
      <>
        <Pop text="ON FIRE" lime />
        <Animated.View entering={FadeInDown.delay(550).duration(400)} style={styles.countRow}>
          <AnimatedNumber value={moment.streak} style={styles.count} delay={600} />
          <Text style={styles.unit}>{t.momentFireUnit.toUpperCase()}</Text>
        </Animated.View>
      </>
    );
    line = withName(t.momentFireLine, name);
    effect = <Flames />;
    primary = toTipps;
    secondary = close(t.momentCelebrate);
  } else if (moment.kind === 'lead') {
    tag = moment.group;
    body = <Pop text={t.momentLeadTitle} lime />;
    line = withName(t.momentLeadLine, name).replace('{group}', moment.group);
    effect = <><Confetti colors={[Colors.primary, Colors.white]} /><Burst /></>;
    secondary = toChat;
  } else if (moment.kind === 'streak') {
    tag = 'BETINA · STREAK';
    body = (
      <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.countRow}>
        <AnimatedNumber value={moment.days} style={[styles.count, styles.countBig]} delay={300} duration={1400} />
        <Text style={styles.unit}>{t.momentStreakUnit.toUpperCase()}</Text>
      </Animated.View>
    );
    line = withName(t.momentStreakLine, name).replace('{n}', String(moment.days));
    effect = <Confetti colors={[Colors.primary, Colors.white]} />;
    primary = close(t.momentThanks);
  } else {
    const k = new Date(moment.kickoff);
    tag = `${t.momentMatchdayTag} · ${k.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' })}`;
    body = (
      <>
        <Animated.Text entering={FadeInDown.delay(250).duration(500)} style={styles.title}>{t.momentMatchdayTitle.toUpperCase()}</Animated.Text>
        <Animated.View entering={FadeInDown.delay(450).duration(400)} style={styles.match}>
          <Text style={styles.matchTeam} numberOfLines={1} adjustsFontSizeToFit>{moment.home.toUpperCase()}</Text>
          <Text style={styles.matchVs}>VS</Text>
          <Text style={[styles.matchTeam, { textAlign: 'right' }]} numberOfLines={1} adjustsFontSizeToFit>{moment.away.toUpperCase()}</Text>
        </Animated.View>
      </>
    );
    line = withName(t.momentMatchdayLine, name).replace('{team}', moment.team);
    effect = <Strip text={t.momentMatchdayTag} />;
    primary = close(t.momentLetsGo);
    secondary = toChat;
  }

  return (
    <Modal visible transparent={false} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Image source={PHOTO[moment.kind]} style={styles.photo} resizeMode="cover" />
        <LinearGradient colors={['transparent', Colors.black]} locations={[0.25, 0.6]} style={StyleSheet.absoluteFill} pointerEvents="none" />
        {effect}
        <View style={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.top}>
            <View style={styles.tag}><Meta color={Colors.primary} numberOfLines={1}>{tag}</Meta></View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable>
          </View>
          <View style={{ flex: 1 }} />
          <View style={styles.body}>{body}</View>
          <Animated.Text entering={FadeIn.delay(900).duration(500)} style={styles.line}>“{line}”</Animated.Text>
          <Animated.View entering={FadeInDown.delay(1000).duration(400)} style={styles.actions}>
            <Pressable onPress={primary.onPress} style={({ pressed }) => [styles.primary, pressed && { opacity: 0.85 }]}>
              <Text style={styles.primaryText} numberOfLines={1} adjustsFontSizeToFit>{primary.label.toUpperCase()}</Text>
              <Text style={styles.primaryText}>→</Text>
            </Pressable>
            {secondary && (
              <Pressable onPress={secondary.onPress} style={({ pressed }) => [styles.secondary, pressed && { borderColor: Colors.primary }]}>
                <Text style={styles.secondaryText}>{secondary.label.toUpperCase()}</Text>
              </Pressable>
            )}
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

// ── TREFFER toast ────────────────────────────────────────────────────────────
/** Slides in from the top for a few seconds; a tap opens the Tippspiel. */
export function HitToast({ hit, name, onClose, onPress }: { hit: HitMoment | null; name: string; onClose: () => void; onPress?: () => void }) {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!hit) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const id = setTimeout(() => closeRef.current(), 4500);
    return () => clearTimeout(id);
  }, [hit]);
  if (!hit) return null;

  const sub = hit.matches > 1
    ? `${t.momentHitFrom.replace('{n}', String(hit.matches))} · ${hit.home_name} ${hit.home}:${hit.away} ${hit.away_name}`
    : `${hit.home_name} ${hit.home}:${hit.away} ${hit.away_name}`;
  return (
    <Animated.View entering={FadeInUp.springify().damping(14)} exiting={FadeOutUp.duration(250)} style={[styles.toastWrap, { top: insets.top + 8 }]} pointerEvents="box-none">
      <Pressable onPress={() => { onClose(); onPress?.(); }} style={styles.toast}>
        <Image source={require('../../assets/urban/betina-wink.jpg')} style={styles.toastPhoto} resizeMode="cover" />
        <View style={styles.toastBody}>
          <Meta color={Colors.black}>{t.momentHitTag}</Meta>
          <Text style={styles.toastLine} numberOfLines={1}>{withName(t.momentHitLine, name)}</Text>
          <Text style={styles.toastSub} numberOfLines={1}>{sub}</Text>
        </View>
        <Animated.View entering={ZoomIn.delay(250).springify()} style={styles.toastPts}>
          <Text style={styles.toastPtsText}>+{hit.points}</Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
  root: { flex: 1, backgroundColor: Colors.black, overflow: 'hidden' },
  photo: { position: 'absolute', top: 0, left: 0, width: '100%', height: '64%' },
  content: { flex: 1, paddingHorizontal: 16, gap: 14 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  tag: { backgroundColor: Colors.black, paddingHorizontal: 8, paddingVertical: 4, flexShrink: 1 },
  close: { width: 38, height: 38, backgroundColor: Colors.black, borderWidth: 1.5, borderColor: Colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: Colors.white, fontSize: 22, fontFamily: Fonts.label },
  body: { gap: 12 },

  burst: { position: 'absolute', left: W / 2, top: H * 0.55, width: 0, height: 0 },
  strip: { position: 'absolute', top: H * 0.42, left: -40, right: -40, backgroundColor: Colors.primary, paddingVertical: 8, transform: [{ rotate: '-5deg' }], overflow: 'hidden' },
  stripRun: { width: W * 4 },
  stripText: { color: Colors.black, fontSize: 18, fontFamily: Fonts.monoBold, letterSpacing: 2 },

  popLime: { backgroundColor: Colors.primary, paddingHorizontal: 14, paddingTop: 4, alignSelf: 'flex-start', maxWidth: '100%' },
  popPlain: { alignSelf: 'flex-start', maxWidth: '100%' },
  popText: { ...displayType(92, 100), color: Colors.white },
  title: { ...displayType(64, 64), color: Colors.white },

  duel: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface, paddingHorizontal: 14, paddingVertical: 8,
  },
  duelSide: { flex: 1, gap: 2 },
  duelScore: { ...displayType(52, 58), color: Colors.white },
  duelColon: { color: Colors.textMuted, fontSize: 40, fontFamily: Fonts.display },

  countRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  count: { ...displayType(96, 100), color: Colors.primary },
  countBig: { fontSize: 132, lineHeight: 136 },
  unit: { ...displayType(26, 28), flex: 1, color: Colors.white, paddingBottom: 14 },

  match: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface, paddingHorizontal: 14, paddingVertical: 12,
  },
  matchTeam: { flex: 1, color: Colors.white, fontSize: 24, fontFamily: Fonts.display },
  matchVs: { color: Colors.primary, fontSize: 16, fontFamily: Fonts.monoBold },

  line: { color: Colors.white, fontSize: 17, lineHeight: 24, fontFamily: Fonts.medium },
  actions: { gap: 8 },
  primary: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12,
    backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 16,
  },
  primaryText: { color: Colors.black, fontSize: 22, fontFamily: Fonts.display, flexShrink: 1 },
  secondary: { borderWidth: 1.5, borderColor: Colors.borderStrong, paddingVertical: 14, alignItems: 'center', backgroundColor: Colors.black },
  secondaryText: { color: Colors.white, fontSize: 16, fontFamily: Fonts.label, letterSpacing: 0.6 },

  toastWrap: { position: 'absolute', left: 12, right: 12, zIndex: 50 },
  toast: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.primary, padding: 8, paddingRight: 12 },
  toastPhoto: { width: 56, height: 56 },
  toastBody: { flex: 1, gap: 1 },
  toastLine: { ...displayType(20, 22), color: Colors.black },
  toastSub: { color: Colors.black, fontSize: 12, fontFamily: Fonts.semibold, opacity: 0.75 },
  toastPts: { backgroundColor: Colors.black, paddingHorizontal: 10, paddingVertical: 4 },
  toastPtsText: { ...displayType(30, 34), color: Colors.primary },
});
