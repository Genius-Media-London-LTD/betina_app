// The moving centre of the voice call: BETina's photo with a square audio
// visualizer (bars shooting out of all four edges), shockwave squares and a
// slowly turning viewfinder. Driven by three shared values from app/voice.tsx:
// energy 0..1, time in seconds, lime (1 = BETina talks → lime, 0 = player → white).
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { Colors } from '../theme';

const S = 340; // stage
const P = 168; // photo
const GAP = 8; // photo edge → bars
const PER_SIDE = 12;
const BAR_W = 6;
const MAX_LEN = 96;
const C = S / 2;
const SIDES = ['top', 'right', 'bottom', 'left'] as const;
const WAVES = [0, 0.25, 0.5, 0.75];

type Vals = { energy: SharedValue<number>; time: SharedValue<number>; lime: SharedValue<number> };

function EdgeBar({ side, k, energy, time, lime }: Vals & { side: (typeof SIDES)[number]; k: number }) {
  const idx = SIDES.indexOf(side) * PER_SIDE + k; // runs once around the photo
  const offset = -P / 2 + ((k + 0.5) * P) / PER_SIDE - BAR_W / 2;
  const edge = P / 2 + GAP;
  const pos =
    side === 'top' ? { left: C + offset, bottom: C + edge, width: BAR_W }
    : side === 'bottom' ? { left: C + offset, top: C + edge, width: BAR_W }
    : side === 'left' ? { top: C + offset, right: C + edge, height: BAR_W }
    : { top: C + offset, left: C + edge, height: BAR_W };

  const style = useAnimatedStyle(() => {
    const t = time.value;
    const e = Math.pow(energy.value, 0.7);
    // A wave that travels around the square plus a faster shimmer.
    const run = Math.sin(t * 6 - idx * 0.45) * 0.5 + 0.5;
    const shimmer = Math.sin(t * 17 + idx * 2.3) * 0.5 + 0.5;
    const len = 4 + e * MAX_LEN * (0.2 + run * 0.6 + shimmer * 0.25);
    const color = lime.value > 0.5 ? Colors.primary : Colors.white;
    return side === 'top' || side === 'bottom'
      ? { height: len, backgroundColor: color, opacity: 0.45 + e * 0.55 }
      : { width: len, backgroundColor: color, opacity: 0.45 + e * 0.55 };
  });
  return <Animated.View style={[styles.bar, pos, style]} />;
}

function Shockwave({ phase, energy, time, lime }: Vals & { phase: number }) {
  const style = useAnimatedStyle(() => {
    const p = (time.value * 0.7 + phase) % 1;
    return {
      opacity: (1 - p) * (0.2 + energy.value * 0.8),
      borderColor: lime.value > 0.5 ? Colors.primary : Colors.white,
      transform: [{ scale: 1 + p * 1.15 }],
    };
  });
  return <Animated.View style={[styles.wave, style]} />;
}

/** Lime block behind the photo that jumps around with the voice (hard-shadow glitch). */
function Glitch({ energy, time, lime }: Vals) {
  const style = useAnimatedStyle(() => {
    const e = energy.value;
    const t = time.value;
    const jx = (Math.sin(t * 23) + Math.sin(t * 41) * 0.5) * e * 9;
    const jy = (Math.cos(t * 19) + Math.sin(t * 37) * 0.5) * e * 9;
    return {
      backgroundColor: lime.value > 0.5 ? Colors.primary : Colors.white,
      opacity: 0.35 + e * 0.65,
      transform: [{ translateX: 8 + jx }, { translateY: 8 + jy }, { scale: 1 + e * 0.05 }],
    };
  });
  return <Animated.View style={[styles.glitch, style]} />;
}

function Viewfinder({ energy, time, lime }: Vals) {
  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${(time.value * 7) % 360}deg` }, { scale: 1 + energy.value * 0.06 }],
  }));
  const cornerStyle = useAnimatedStyle(() => ({ borderColor: lime.value > 0.5 ? Colors.primary : Colors.white }));
  return (
    <Animated.View style={[styles.finder, style]}>
      {(['tl', 'tr', 'bl', 'br'] as const).map((c) => (
        <Animated.View key={c} style={[styles.corner, styles[c], cornerStyle]} />
      ))}
    </Animated.View>
  );
}

export default function VoiceStage(vals: Vals) {
  const photoStyle = useAnimatedStyle(() => ({
    borderColor: vals.lime.value > 0.5 ? Colors.primary : Colors.white,
    transform: [{ scale: 1 + vals.energy.value * 0.05 }],
  }));
  return (
    <View style={styles.stage}>
      {WAVES.map((phase) => <Shockwave key={phase} phase={phase} {...vals} />)}
      <Viewfinder {...vals} />
      {SIDES.map((side) =>
        Array.from({ length: PER_SIDE }, (_, k) => <EdgeBar key={`${side}${k}`} side={side} k={k} {...vals} />),
      )}
      <Glitch {...vals} />
      <Animated.View style={[styles.photo, photoStyle]}>
        <Image source={require('../../assets/urban/betina-voice.jpg')} style={styles.photoImage} resizeMode="cover" />
      </Animated.View>
    </View>
  );
}

const CORNER = 34;
const styles = StyleSheet.create({
  stage: { width: S, height: S },
  bar: { position: 'absolute' },
  wave: {
    position: 'absolute', left: C - P / 2, top: C - P / 2, width: P, height: P, borderWidth: 3,
  },
  glitch: { position: 'absolute', left: C - P / 2, top: C - P / 2, width: P, height: P, backgroundColor: Colors.primary },
  finder: { position: 'absolute', left: C - 150, top: C - 150, width: 300, height: 300 },
  corner: { position: 'absolute', width: CORNER, height: CORNER },
  tl: { left: 0, top: 0, borderLeftWidth: 3, borderTopWidth: 3 },
  tr: { right: 0, top: 0, borderRightWidth: 3, borderTopWidth: 3 },
  bl: { left: 0, bottom: 0, borderLeftWidth: 3, borderBottomWidth: 3 },
  br: { right: 0, bottom: 0, borderRightWidth: 3, borderBottomWidth: 3 },
  photo: {
    position: 'absolute', left: C - P / 2, top: C - P / 2, width: P, height: P,
    borderWidth: 2, overflow: 'hidden', backgroundColor: Colors.surface,
  },
  photoImage: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
});
