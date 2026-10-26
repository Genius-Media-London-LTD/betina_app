// Recurring pieces of the urban design (Claude Design handoff "BETina – Urban"):
// stickers, headlines with a lime word, Space Mono meta, blinking live squares,
// outline numbers, the GeniusBet logo box and the marquee ticker.
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { Colors, Fonts, Shadows, displayType } from '../theme';

/** Rotated lime label with a hard black shadow ("EXKLUSIV", "+100 XP", tier names). */
export function Sticker({ text, rotate = -3, style, dark, size = 14 }: { text: string; rotate?: number; style?: ViewStyle; dark?: boolean; size?: number }) {
  return (
    <View style={[styles.sticker, dark && styles.stickerDark, Shadows.hard, { transform: [{ rotate: `${rotate}deg` }] }, style]}>
      <Text style={[styles.stickerText, dark && styles.stickerTextDark, size !== 14 && { fontSize: size, fontFamily: Fonts.display }]}>{text.toUpperCase()}</Text>
    </View>
  );
}

/**
 * Anton headline, uppercase. `accent` paints the first or last word lime
 * (the design's signature: "LOG DICH <lime>EIN.</lime>").
 */
export function Headline({
  text, size = 44, accent = 'last', color = Colors.white, style, numberOfLines,
}: {
  text: string; size?: number; accent?: 'first' | 'last' | 'none'; color?: string; style?: TextStyle; numberOfLines?: number;
}) {
  const words = text.toUpperCase().split(' ');
  const lineHeight = Math.round(size * 0.92);
  if (accent === 'none' || words.length === 1) {
    return (
      <Text style={[styles.headline, { ...displayType(size, lineHeight), color }, style]} numberOfLines={numberOfLines}>
        {accent === 'none' ? text.toUpperCase() : <Text style={{ color: Colors.primary }}>{text.toUpperCase()}</Text>}
      </Text>
    );
  }
  const lime = accent === 'first' ? words[0] : words[words.length - 1];
  const rest = accent === 'first' ? words.slice(1).join(' ') : words.slice(0, -1).join(' ');
  return (
    <Text style={[styles.headline, { ...displayType(size, lineHeight), color }, style]} numberOfLines={numberOfLines}>
      {accent === 'first' ? (
        <>
          <Text style={{ color: Colors.primary }}>{lime}</Text> {rest}
        </>
      ) : (
        <>
          {rest} <Text style={{ color: Colors.primary }}>{lime}</Text>
        </>
      )}
    </Text>
  );
}

/** Space Mono meta line, uppercase with wide tracking. */
export function Meta({ children, color = Colors.textMuted, size = 10, style, numberOfLines }: {
  children: React.ReactNode; color?: string; size?: number; style?: TextStyle; numberOfLines?: number;
}) {
  return (
    <Text style={[styles.meta, { color, fontSize: size }, style]} numberOfLines={numberOfLines}>
      {typeof children === 'string' ? children.toUpperCase() : children}
    </Text>
  );
}

/** Square that blinks on/off every second (LIVE / REC). */
export function Blink({ size = 6, color = Colors.live }: { size?: number; color?: string }) {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setOn((v) => !v), 500);
    return () => clearInterval(id);
  }, []);
  return <View style={{ width: size, height: size, backgroundColor: color, opacity: on ? 1 : 0 }} />;
}

/** Outline digits (the design's -webkit-text-stroke look, drawn with offset copies). */
export function OutlineNumber({ value, size = 44, color = Colors.primary, fill = Colors.black }: {
  value: string; size?: number; color?: string; fill?: string;
}) {
  const s = Math.max(1, size / 36);
  const offsets = [[-s, 0], [s, 0], [0, -s], [0, s], [-s, -s], [s, s], [-s, s], [s, -s]];
  const base = displayType(size, Math.round(size * 0.95));
  return (
    <View>
      {offsets.map(([x, y], i) => (
        <Text key={i} style={[base, styles.outlineCopy, { color, transform: [{ translateX: x }, { translateY: y }] }]}>{value}</Text>
      ))}
      <Text style={[base, { color: fill }]}>{value}</Text>
    </View>
  );
}

/** GeniusBet mark in a dark square (BETina's badge in takes / chat). */
export function LogoBox({ size = 40 }: { size?: number }) {
  return (
    <View style={[styles.logoBox, { width: size, height: size }]}>
      <Image source={require('../../assets/urban/logo-mark.png')} style={{ width: size * 0.47, height: size * 0.53 }} resizeMode="contain" />
    </View>
  );
}

/**
 * Lime marquee bar: a black label box ("BREAKING") and an endless run of
 * items separated by the GeniusBet mark. Speed in px/s.
 */
export function Ticker({ label, items, speed = 45 }: { label: string; items: string[]; speed?: number }) {
  const [runWidth, setRunWidth] = useState(0);
  const x = useSharedValue(0);

  useEffect(() => {
    if (!runWidth) return;
    x.value = 0;
    x.value = withRepeat(withTiming(-runWidth, { duration: (runWidth / speed) * 1000, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(x);
  }, [runWidth, speed, x]);

  const move = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const run = (key: string, measure: boolean) => (
    <View key={key} style={styles.run} onLayout={measure ? (e) => setRunWidth(e.nativeEvent.layout.width) : undefined}>
      {items.map((it, i) => (
        <View key={i} style={styles.runItem}>
          <Text style={styles.tickerText} numberOfLines={1}>{it.toUpperCase()}</Text>
          <Image source={require('../../assets/urban/logo-mark.png')} style={styles.tickerMark} resizeMode="contain" />
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.ticker}>
      <View style={styles.tickerLabel}>
        <Blink color={Colors.primary} />
        <Text style={styles.tickerLabelText}>{label.toUpperCase()}</Text>
      </View>
      <View style={styles.tickerTrack}>
        <Animated.View style={[styles.tickerMove, move]}>
          {run('a', true)}
          {run('b', false)}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sticker: { alignSelf: 'flex-start', backgroundColor: Colors.primary, paddingHorizontal: 9, paddingVertical: 3 },
  stickerDark: { backgroundColor: Colors.black },
  stickerText: { color: Colors.black, fontSize: 14, fontFamily: Fonts.label, letterSpacing: 0.8 },
  stickerTextDark: { color: Colors.primary },
  headline: { fontFamily: Fonts.display, letterSpacing: 0.2 },
  meta: { fontFamily: Fonts.mono, letterSpacing: 0.9 },
  outlineCopy: { position: 'absolute', left: 0, top: 0 },
  logoBox: {
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  ticker: { height: 30, backgroundColor: Colors.primary, flexDirection: 'row', overflow: 'hidden' },
  tickerLabel: {
    backgroundColor: Colors.black, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, zIndex: 1,
  },
  tickerLabelText: { color: Colors.primary, fontSize: 13, fontFamily: Fonts.label, letterSpacing: 0.8 },
  tickerTrack: { flex: 1, overflow: 'hidden', justifyContent: 'center' },
  tickerMove: { flexDirection: 'row', position: 'absolute', left: 0 },
  run: { flexDirection: 'row', paddingLeft: 10 },
  runItem: { flexDirection: 'row', alignItems: 'center', gap: 10, marginRight: 10 },
  tickerText: { color: Colors.black, fontSize: 13, fontFamily: Fonts.label, letterSpacing: 0.4 },
  tickerMark: { width: 11, height: 12, tintColor: Colors.black },
});
