// Special moments (designs Urban 18 / 20): Tier up and Birthday. Shown once,
// from Home: tier-up when the player's tier rose since the last visit, the
// birthday moment once on their birthday. Celebration only — no rewards,
// no money.
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Dimensions, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing, FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSpring, withTiming,
} from 'react-native-reanimated';
import { Meta } from './Urban';
import { tiers } from '../lib/demo';
import { useI18n } from '../lib/i18n';
import { Colors, Fonts } from '../theme';

const { width: W, height: H } = Dimensions.get('window');

export type Moment = { kind: 'tierup'; from: string; to: string } | { kind: 'birthday' };

const TIER_KEY = 'moment_seen_tier';
const BDAY_KEY = 'moment_bday_year';

/**
 * Which moment (if any) to show now. Remembers what was shown, so each fires
 * once: the first visit only records the current tier.
 */
export async function nextMoment(profile: { vip_tier?: string | null; birthday?: string | null }): Promise<Moment | null> {
  try {
    const tier = profile.vip_tier ?? 'INITIATE';
    const seen = await AsyncStorage.getItem(TIER_KEY);
    await AsyncStorage.setItem(TIER_KEY, tier);
    const rank = (n: string | null) => tiers.findIndex((x) => x.name === n);
    if (seen && rank(tier) > rank(seen)) return { kind: 'tierup', from: seen, to: tier };

    if (profile.birthday) {
      const [, m, d] = profile.birthday.split('-').map(Number);
      const now = new Date();
      if (m === now.getMonth() + 1 && d === now.getDate()) {
        const year = String(now.getFullYear());
        if ((await AsyncStorage.getItem(BDAY_KEY)) !== year) {
          await AsyncStorage.setItem(BDAY_KEY, year);
          return { kind: 'birthday' };
        }
      }
    }
  } catch {
    // storage unavailable: no moment rather than a repeating one
  }
  return null;
}

/** Put the name into a line; without one, drop it with its comma. */
export function withName(s: string, name: string) {
  if (name) return s.replace('{name}', name);
  const out = s.replace(/,\s*\{name\}/, '').replace(/\{name\}[,!]?\s*/, '');
  return out.charAt(0).toUpperCase() + out.slice(1);
}

// ── Falling confetti ─────────────────────────────────────────────────────────
const PIECES = Array.from({ length: 26 }, (_, i) => ({
  x: ((i * 61) % 100) / 100,
  w: 6 + (i % 3) * 4,
  h: 3 + (i % 2) * 3,
  delay: (i * 137) % 1800,
  duration: 2600 + ((i * 53) % 1600),
  turn: i % 2 ? 1 : -1,
}));

function Piece({ x, w, h, delay, duration, turn, color }: (typeof PIECES)[number] & { color: string }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(delay, withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1, false));
  }, [delay, duration, p]);
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: -30 + p.value * (H + 60) },
      { translateX: Math.sin(p.value * 6) * 14 },
      { rotate: `${turn * p.value * 540}deg` },
    ],
  }));
  return <Animated.View style={[styles.piece, { left: x * W, width: w, height: h, backgroundColor: color }, style]} />;
}

export function Confetti({ colors }: { colors: string[] }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {PIECES.map((p, i) => <Piece key={i} {...p} color={colors[i % colors.length]} />)}
    </View>
  );
}

// ── Moment screens ───────────────────────────────────────────────────────────
export default function MomentModal({ moment, name, onClose }: { moment: Moment | null; name: string; onClose: () => void }) {
  useEffect(() => {
    if (moment) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [moment]);
  if (!moment) return null;
  return (
    <Modal visible transparent={false} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      {moment.kind === 'tierup'
        ? <TierUp from={moment.from} to={moment.to} name={name} onClose={onClose} />
        : <Birthday name={name} onClose={onClose} />}
    </Modal>
  );
}

function TierUp({ from, to, name, onClose }: { from: string; to: string; name: string; onClose: () => void }) {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const stamp = useSharedValue(0);
  const idx = tiers.findIndex((x) => x.name === to);
  const tier = tiers[idx];

  useEffect(() => {
    stamp.value = withDelay(500, withSpring(1, { damping: 8, stiffness: 130 }));
  }, [stamp]);
  const stampStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, stamp.value * 1.4),
    transform: [{ scale: 1.6 - stamp.value * 0.6 }, { rotate: `${-4 + stamp.value * 2}deg` }],
  }));

  return (
    <View style={[styles.tierRoot, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }]}>
      <Confetti colors={[Colors.black, Colors.white]} />
      <View style={styles.tierTop}>
        <Meta color={Colors.black} style={{ fontFamily: Fonts.monoBold }}>{`${String(idx + 1).padStart(2, '0')} / ${String(tiers.length).padStart(2, '0')}`}</Meta>
        <Meta color={Colors.black} style={{ fontFamily: Fonts.monoBold }}>{new Date().toLocaleDateString()}</Meta>
      </View>

      <Animated.View entering={FadeIn.delay(150).duration(400)} style={styles.strip}>
        <Text style={styles.stripText} numberOfLines={1}>TIER UP · TIER UP · TIER UP · TIER UP · TIER UP</Text>
      </Animated.View>

      <View style={styles.tierCenter}>
        <Text style={styles.oldTier}>{from}</Text>
        <Animated.Text style={[styles.newTier, stampStyle]} numberOfLines={1} adjustsFontSizeToFit>{to}.</Animated.Text>
        <Animated.Text entering={FadeInDown.delay(900).duration(400)} style={styles.tierLine}>
          “{withName(t.momentTierLine, name).replace('{tier}', to)}” — BETina
        </Animated.Text>
        {tier && tier.cashback !== '—' && (
          <Animated.View entering={FadeInDown.delay(1100).duration(400)} style={styles.perk}>
            <Text style={styles.perkLabel}>{t.momentCashback.toUpperCase()}</Text>
            <Text style={styles.perkValue}>{tier.cashback}</Text>
          </Animated.View>
        )}
      </View>

      <Animated.View entering={FadeInDown.delay(1200).duration(400)} style={styles.tierActions}>
        <Pressable onPress={onClose} style={({ pressed }) => [styles.blackBtn, pressed && { opacity: 0.85 }]}>
          <Text style={styles.blackBtnText}>{t.momentCelebrate.toUpperCase()}</Text>
          <Text style={styles.blackBtnText}>→</Text>
        </Pressable>
        <Pressable onPress={() => { onClose(); router.push('/tiers'); }} style={styles.outlineBtn}>
          <Text style={styles.outlineBtnText}>TIERS</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

function Birthday({ name, onClose }: { name: string; onClose: () => void }) {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const day = new Date().toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' });
  return (
    <View style={styles.bdayRoot}>
      <Image source={require('../../assets/urban/betina-splash.jpg')} style={styles.bdayPhoto} resizeMode="cover" />
      <LinearGradient colors={['transparent', Colors.black]} locations={[0.3, 0.62]} style={StyleSheet.absoluteFill} pointerEvents="none" />
      <Confetti colors={[Colors.primary, Colors.white]} />
      <View style={[styles.bdayContent, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.bdayTop}>
          <View style={styles.tag}><Meta color={Colors.primary}>{`${day} · ${t.momentBdayTag}`}</Meta></View>
          <Pressable onPress={onClose} hitSlop={10} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable>
        </View>
        <View style={{ flex: 1 }} />
        <Animated.View entering={FadeInDown.delay(250).duration(700)}>
          {t.momentBdayTitle.toUpperCase().split(' ').map((w, i) => (
            <Text key={i} style={styles.bdayTitle}>{w}</Text>
          ))}
          <Text style={[styles.bdayTitle, { color: Colors.primary }]} numberOfLines={1} adjustsFontSizeToFit>{name.toUpperCase()}.</Text>
        </Animated.View>
        <Animated.Text entering={FadeInDown.delay(500).duration(600)} style={styles.bdayLine}>
          “{withName(t.momentBdayLine, name)}”
        </Animated.Text>
        <Animated.View entering={FadeInDown.delay(700).duration(600)}>
          <Pressable onPress={onClose} style={({ pressed }) => [styles.limeBtn, pressed && { opacity: 0.85 }]}>
            <Text style={styles.limeBtnText}>{t.momentThanks.toUpperCase()}</Text>
            <Text style={styles.limeBtnText}>→</Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  piece: { position: 'absolute', top: 0 },

  tierRoot: { flex: 1, backgroundColor: Colors.primary, paddingHorizontal: 16, overflow: 'hidden' },
  tierTop: { flexDirection: 'row', justifyContent: 'space-between' },
  strip: { backgroundColor: Colors.black, marginHorizontal: -40, marginTop: 40, paddingVertical: 8, transform: [{ rotate: '-4deg' }] },
  stripText: { color: Colors.primary, fontSize: 18, fontFamily: Fonts.monoBold, letterSpacing: 2 },
  tierCenter: { flex: 1, justifyContent: 'center', gap: 6 },
  oldTier: { color: Colors.black, opacity: 0.45, fontSize: 40, fontFamily: Fonts.display, textDecorationLine: 'line-through' },
  newTier: { color: Colors.black, fontSize: 96, lineHeight: 100, fontFamily: Fonts.display },
  tierLine: { color: Colors.black, fontSize: 17, lineHeight: 24, fontFamily: Fonts.semibold, marginTop: 8 },
  perk: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14,
    borderTopWidth: 2, borderBottomWidth: 2, borderColor: Colors.black, paddingVertical: 10,
  },
  perkLabel: { color: Colors.black, fontSize: 16, fontFamily: Fonts.label },
  perkValue: { color: Colors.black, fontSize: 34, fontFamily: Fonts.display },
  tierActions: { flexDirection: 'row', gap: 8 },
  blackBtn: {
    flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.black, paddingHorizontal: 16, paddingVertical: 16,
  },
  blackBtnText: { color: Colors.primary, fontSize: 22, fontFamily: Fonts.display },
  outlineBtn: { borderWidth: 2, borderColor: Colors.black, paddingHorizontal: 16, justifyContent: 'center' },
  outlineBtnText: { color: Colors.black, fontSize: 16, fontFamily: Fonts.label },

  bdayRoot: { flex: 1, backgroundColor: Colors.black },
  bdayPhoto: { position: 'absolute', top: 0, left: 0, width: '100%', height: '62%' },
  bdayContent: { flex: 1, paddingHorizontal: 16, gap: 12 },
  bdayTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tag: { backgroundColor: Colors.black, paddingHorizontal: 8, paddingVertical: 4 },
  close: { width: 38, height: 38, backgroundColor: Colors.black, borderWidth: 1.5, borderColor: Colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: Colors.white, fontSize: 22, fontFamily: Fonts.label },
  bdayTitle: { color: Colors.white, fontSize: 72, lineHeight: 70, fontFamily: Fonts.display },
  bdayLine: { color: Colors.white, fontSize: 17, lineHeight: 24, fontFamily: Fonts.medium },
  limeBtn: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 16, marginTop: 6,
  },
  limeBtnText: { color: Colors.black, fontSize: 22, fontFamily: Fonts.display },
});
