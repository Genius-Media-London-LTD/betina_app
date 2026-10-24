import React, { useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '../theme';

type ParticleSpec = {
  left: number;
  top: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
  glow: boolean;
};

type Props = {
  count?: number;
  variant?: 'green' | 'gold';
  /** Also rain confetti rectangles from the top (celebrations) */
  confetti?: boolean;
};

const { height: SCREEN_H } = Dimensions.get('window');

function Particle({ spec }: { spec: ParticleSpec }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      spec.delay,
      withRepeat(withTiming(1, { duration: spec.duration, easing: Easing.out(Easing.quad) }), -1),
    );
  }, [progress, spec]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value < 0.2 ? progress.value * 5 : 1 - (progress.value - 0.2) / 0.8,
    transform: [
      { translateY: 20 - progress.value * 160 },
      { scale: 0.6 + progress.value * 0.5 },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: `${spec.left}%`,
          top: `${spec.top}%`,
          width: spec.size,
          height: spec.size,
          borderRadius: spec.size / 2,
          backgroundColor: spec.color,
        },
        spec.glow && {
          shadowColor: spec.color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 8,
          elevation: 6,
        },
        style,
      ]}
    />
  );
}

function ConfettiPiece({ spec, color }: { spec: ParticleSpec; color: string }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      spec.delay,
      withRepeat(withTiming(1, { duration: spec.duration, easing: Easing.linear }), -1),
    );
  }, [progress, spec]);

  const style = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [
      { translateY: -40 + progress.value * SCREEN_H * 0.4 },
      { rotate: `${progress.value * 320}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: `${spec.left}%`,
          top: `${spec.top}%`,
          width: 9,
          height: 9,
          borderRadius: 0,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

const PALETTES = {
  green: [Colors.primary, Colors.primaryLight, Colors.primaryLight],
  gold: [Colors.gold, Colors.goldLight, Colors.goldLight],
};

// Urban moments: lime, white and black squares only.
const CONFETTI_COLORS = [Colors.primary, Colors.white, Colors.primaryLight, Colors.white];

// Deterministic pseudo-random layout so the field is stable across renders.
function makeSpecs(count: number, palette: string[], seed: number): ParticleSpec[] {
  const specs: ParticleSpec[] = [];
  for (let i = 0; i < count; i++) {
    const r = (n: number) => {
      const x = Math.sin(seed + i * 12.9898 + n * 78.233) * 43758.5453;
      return x - Math.floor(x);
    };
    specs.push({
      left: 4 + r(1) * 90,
      top: 35 + r(2) * 45,
      size: 4 + Math.round(r(3) * 4),
      color: palette[i % palette.length],
      duration: 2800 + Math.round(r(4) * 1200),
      delay: Math.round(r(5) * 2400),
      glow: r(6) > 0.5,
    });
  }
  return specs;
}

/**
 * Confetti for celebration moments. The urban design has no ambient glow
 * particles, so without `confetti` this renders nothing.
 */
export default function ParticlesBg({ count = 10, variant = 'green', confetti = false }: Props) {
  const confettiSpecs = useMemo(
    () =>
      confetti
        ? makeSpecs(8, PALETTES[variant], 21).map((s) => ({ ...s, top: 4 + (s.top - 35) / 4 }))
        : [],
    [confetti, variant],
  );

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {confettiSpecs.map((spec, i) => (
        <ConfettiPiece key={`c${i}`} spec={spec} color={CONFETTI_COLORS[i % CONFETTI_COLORS.length]} />
      ))}
    </View>
  );
}
