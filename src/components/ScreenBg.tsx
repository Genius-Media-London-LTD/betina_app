import React, { useEffect } from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming,
} from 'react-native-reanimated';
import { Colors, withAlpha } from '../theme';

type Props = ViewProps & {
  /** Vertical position of the primary radial glow, 0..1 of screen height */
  glowTop?: number;
  glowColor?: 'accent' | 'gold' | 'green';
  glowSize?: number;
  /** Pulsing ambient orbs behind the content (landing-page vibe). */
  orbs?: boolean;
};

// Urban look: restrained light on true black — the neon does the talking.
const GLOWS = {
  accent: [withAlpha(Colors.accent, 0.16), withAlpha(Colors.accent, 0.04), withAlpha(Colors.background, 0)],
  gold: [withAlpha(Colors.gold, 0.22), withAlpha(Colors.primary, 0.06), withAlpha(Colors.background, 0)],
  green: [withAlpha(Colors.primary, 0.18), withAlpha(Colors.primary, 0.05), withAlpha(Colors.background, 0)],
} as const;

const GRID = 36;

/** Faint display grid behind every screen — the "technical" texture. */
function Grid() {
  const lines = Array.from({ length: 40 }, (_, i) => i);
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
      {lines.map((i) => (
        <View key={`v${i}`} style={[styles.gridV, { left: i * GRID }]} />
      ))}
      {lines.map((i) => (
        <View key={`h${i}`} style={[styles.gridH, { top: i * GRID }]} />
      ))}
      {/* Fade the grid out towards the bottom so content stays calm. */}
      <LinearGradient
        colors={[withAlpha(Colors.background, 0), Colors.background]}
        locations={[0.15, 0.85]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

/** A soft, slowly-pulsing ambient orb (fakes a radial glow with a clipped gradient). */
function Orb({
  color, size, top, left, right, duration, delay,
}: {
  color: string; size: number; top: number; left?: number; right?: number; duration: number; delay: number;
}) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.quad) }), -1, true),
    );
  }, [p, duration, delay]);
  const style = useAnimatedStyle(() => ({ opacity: 0.5 + p.value * 0.5 }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: 'absolute', width: size, height: size, borderRadius: size / 2, top, left, right, overflow: 'hidden' },
        style,
      ]}
    >
      <LinearGradient
        colors={[color, withAlpha(Colors.background, 0)]}
        locations={[0, 0.6]}
        start={{ x: 0.5, y: 0.3 }}
        end={{ x: 0.5, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: size / 2 }]}
      />
    </Animated.View>
  );
}

/**
 * True-black screen background with a faint display grid, a soft radial glow +
 * pulsing ambient orbs every BETina screen carries (matches the landing page).
 */
export default function ScreenBg({
  glowTop = 0.14,
  glowColor = 'accent',
  glowSize = 460,
  orbs = true,
  style,
  children,
  ...rest
}: Props) {
  return (
    <View style={[styles.root, style]} {...rest}>
      {orbs && (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
          {/* Centres sit off-screen so only a soft ambient bleed shows (no hard circles). */}
          <Orb color={withAlpha(Colors.primary, 0.09)} size={560} top={-320} left={-240} duration={7000} delay={0} />
          <Orb color={withAlpha(Colors.accent, 0.06)} size={600} top={280} right={-320} duration={9000} delay={800} />
        </View>
      )}
      <Grid />

      <View
        pointerEvents="none"
        style={[
          styles.glowWrap,
          {
            width: glowSize,
            height: glowSize,
            borderRadius: glowSize / 2,
            top: `${glowTop * 100}%`,
            marginTop: -glowSize / 2,
            marginLeft: -glowSize / 2,
          },
        ]}
      >
        <LinearGradient
          colors={[...GLOWS[glowColor]] as [string, string, string]}
          locations={[0, 0.45, 0.75]}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 0.5, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: glowSize / 2, opacity: 0.9 }]}
        />
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
    // Clip the ambient orbs to the screen so nothing bleeds past the edge and
    // triggers horizontal scroll (which flashed a white margin on iOS).
    overflow: 'hidden',
  },
  gridV: { position: 'absolute', top: 0, bottom: 0, width: StyleSheet.hairlineWidth, backgroundColor: withAlpha(Colors.white, 0.035) },
  gridH: { position: 'absolute', left: 0, right: 0, height: StyleSheet.hairlineWidth, backgroundColor: withAlpha(Colors.white, 0.035) },
  glowWrap: {
    position: 'absolute',
    left: '50%',
    overflow: 'hidden',
  },
});
