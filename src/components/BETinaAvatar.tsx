import React, { useEffect } from 'react';
import { Image, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '../theme';

type Props = {
  size?: number;
  /** Show expanding square pulse outlines around the avatar */
  pulse?: boolean;
  /** Online marker in the bottom-right corner */
  online?: boolean;
  /** Frame colour */
  variant?: 'default' | 'gold' | 'celebrate';
  style?: ViewStyle;
};

const FRAME: Record<NonNullable<Props['variant']>, string> = {
  default: Colors.primary,
  gold: Colors.gold,
  celebrate: Colors.primaryLight,
};

function Pulse({ delay, color }: { delay: number; color: string }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: 2400, easing: Easing.out(Easing.quad) }), -1),
    );
  }, [delay, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.8 * (1 - progress.value),
    transform: [{ scale: 1 + progress.value * 0.28 }],
  }));

  return <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderWidth: 1.5, borderColor: color }, animatedStyle]} />;
}

/** BETina's square portrait (urban look: hard edges, lime frame). */
export default function BETinaAvatar({
  size = 52,
  pulse = false,
  online = false,
  variant = 'default',
  style,
}: Props) {
  const frame = FRAME[variant];
  return (
    <View style={[{ width: size, height: size }, style]}>
      {pulse && (
        <>
          <Pulse delay={0} color={frame} />
          <Pulse delay={1200} color={frame} />
        </>
      )}
      <View style={[styles.frame, { borderColor: frame, borderWidth: size >= 40 ? 1.5 : 1 }]}>
        <Image source={require('../../assets/urban/betina-avatar.jpg')} style={styles.image} resizeMode="cover" />
      </View>
      {online && <View style={[styles.online, { width: size * 0.22, height: size * 0.22 }]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { flex: 1, overflow: 'hidden', backgroundColor: Colors.surface },
  image: { width: '100%', height: '100%' },
  online: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.background,
  },
});
