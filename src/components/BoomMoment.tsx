// "BOOM." — the Tippspiel moment for an exact hit (design: Urban 19). Lime
// square particles burst from the centre, the BOOM block pops in, the score
// card and the XP sticker follow. XP only: no money, no prizes.
import React, { useEffect } from 'react';
import { Dimensions, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing, FadeIn, FadeInDown, ZoomIn, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming,
} from 'react-native-reanimated';
import { Meta, Sticker } from './Urban';
import { useI18n } from '../lib/i18n';
import type { ExactHit } from '../lib/tippspiel';
import { Colors, Fonts, displayType } from '../theme';

const { width: W, height: H } = Dimensions.get('window');
const XP_PER_EXACT = 15; // 3 points × 5 XP (010_tippspiel.sql)

// Fixed pseudo-random burst so the layout is stable between renders.
const PARTICLES = Array.from({ length: 26 }, (_, i) => {
  const angle = (i / 26) * Math.PI * 2 + (i % 3) * 0.4;
  const dist = 120 + ((i * 37) % 160);
  return {
    dx: Math.cos(angle) * dist,
    dy: Math.sin(angle) * dist,
    size: 6 + ((i * 7) % 12),
    lime: i % 4 !== 0,
    delay: (i % 5) * 40,
  };
});

function Particle({ dx, dy, size, lime, delay }: (typeof PARTICLES)[number]) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(150 + delay, withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) }));
  }, [delay, p]);
  const style = useAnimatedStyle(() => ({
    opacity: 1 - p.value * 0.85,
    transform: [{ translateX: dx * p.value }, { translateY: dy * p.value }, { scale: 0.4 + p.value * 0.6 }],
  }));
  return (
    <Animated.View
      style={[styles.particle, { width: size, height: size, backgroundColor: lime ? Colors.primary : Colors.white }, style]}
    />
  );
}

export default function BoomMoment({
  hit, name, onClose, onMore, onCelebrate,
}: {
  hit: ExactHit | null;
  name: string;
  onClose: () => void;
  onMore: () => void;
  onCelebrate: () => void;
}) {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const pop = useSharedValue(0);

  useEffect(() => {
    if (!hit) return;
    pop.value = 0;
    pop.value = withDelay(120, withSpring(1, { damping: 9, stiffness: 140 }));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [hit, pop]);

  const boomStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, pop.value * 1.5),
    transform: [{ scale: 0.3 + pop.value * 0.7 }, { rotate: `${-10 + pop.value * 5}deg` }],
  }));

  if (!hit) return null;
  const quote = t.tipBoomQuote.replace('{name}', name).replace(/^(.*?),\s*\./, '$1.');

  return (
    <Modal visible transparent={false} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.root, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.top}>
          <Meta color={Colors.primary}>{`${t.tipBoomExact} · ${hit.competition}`}</Meta>
          <Pressable onPress={onClose} hitSlop={10} style={styles.close}>
            <Text style={styles.closeText}>×</Text>
          </Pressable>
        </View>

        <View style={styles.center}>
          <View style={styles.burst} pointerEvents="none">
            {PARTICLES.map((p, i) => <Particle key={i} {...p} />)}
          </View>
          <Animated.View style={[styles.boom, boomStyle]}>
            <Text style={styles.boomText}>BOOM.</Text>
          </Animated.View>
          <Animated.Text entering={FadeInDown.delay(450).duration(400)} style={styles.title}>
            {t.tipBoomTitle.toUpperCase()}
          </Animated.Text>

          <Animated.View entering={FadeInDown.delay(600).duration(400)} style={styles.score}>
            <Text style={styles.team} numberOfLines={1} adjustsFontSizeToFit>{hit.home_name.toUpperCase()}</Text>
            <Text style={styles.result}>{hit.home}:{hit.away}</Text>
            <Text style={[styles.team, { textAlign: 'right' }]} numberOfLines={1} adjustsFontSizeToFit>{hit.away_name.toUpperCase()}</Text>
          </Animated.View>

          <Animated.View entering={ZoomIn.delay(800).springify()}>
            <Sticker text={`+${XP_PER_EXACT} XP`} rotate={-4} size={34} style={styles.xp} />
          </Animated.View>

          <Animated.Text entering={FadeIn.delay(1000).duration(500)} style={styles.quote}>“{quote}”</Animated.Text>
        </View>

        <Animated.View entering={FadeInDown.delay(1100).duration(400)} style={styles.actions}>
          <Pressable onPress={onMore} style={({ pressed }) => [styles.primary, pressed && { opacity: 0.85 }]}>
            <Text style={styles.primaryText}>{t.tipBoomMore.toUpperCase()}</Text>
            <Text style={styles.primaryText}>→</Text>
          </Pressable>
          <Pressable onPress={onCelebrate} style={({ pressed }) => [styles.secondary, pressed && { borderColor: Colors.primary }]}>
            <Text style={styles.secondaryText}>{t.tipBoomCelebrate.toUpperCase()}</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.black, paddingHorizontal: 16 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  close: { width: 38, height: 38, borderWidth: 1.5, borderColor: Colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: Colors.white, fontSize: 22, fontFamily: Fonts.label },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18 },
  burst: { position: 'absolute', left: W / 2 - 16, top: H * 0.3, width: 0, height: 0 },
  particle: { position: 'absolute' },
  boom: { backgroundColor: Colors.primary, paddingHorizontal: 18, paddingTop: 4, alignSelf: 'stretch', alignItems: 'center' },
  boomText: { ...displayType(132, 140), color: Colors.black },
  title: { ...displayType(40, 40), color: Colors.white, textAlign: 'center' },
  score: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch', gap: 10,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface, paddingHorizontal: 14, paddingVertical: 10,
  },
  team: { flex: 1, color: Colors.white, fontSize: 24, fontFamily: Fonts.display },
  result: { ...displayType(56, 60), color: Colors.primary },
  xp: { paddingHorizontal: 14, paddingVertical: 6 },
  quote: { color: Colors.textSecondary, fontSize: 16, lineHeight: 23, fontFamily: Fonts.medium, textAlign: 'center', paddingHorizontal: 12 },
  actions: { gap: 8 },
  primary: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 16,
  },
  primaryText: { color: Colors.black, fontSize: 22, fontFamily: Fonts.display },
  secondary: { borderWidth: 1.5, borderColor: Colors.borderStrong, paddingVertical: 14, alignItems: 'center' },
  secondaryText: { color: Colors.white, fontSize: 16, fontFamily: Fonts.label, letterSpacing: 0.6 },
});
