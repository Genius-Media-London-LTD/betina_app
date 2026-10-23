import React, { useEffect } from 'react';
import { Image, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Colors, withAlpha } from '../theme';

type Props = {
  size?: number;
  /** Show expanding pulse rings around the avatar */
  pulse?: boolean;
  /** Online dot in the bottom-right corner */
  online?: boolean;
  /** Ring gradient variant */
  variant?: 'default' | 'gold' | 'celebrate';
  style?: ViewStyle;
};

const RING_COLORS: Record<NonNullable<Props['variant']>, [string, string, ...string[]]> = {
  default: [Colors.primary, withAlpha(Colors.accent, 0.9)],
  gold: [Colors.gold, Colors.primary, withAlpha(Colors.accent, 0.9)],
  celebrate: [Colors.primary, Colors.primaryLight, withAlpha(Colors.accent, 0.9)],
};

function PulseRing({ size, delay, color }: { size: number; delay: number; color: string }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: 2600, easing: Easing.out(Easing.quad) }), -1),
    );
  }, [delay, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.7 * (1 - progress.value),
    transform: [{ scale: 0.92 + progress.value * 0.33 }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        { borderRadius: size / 2, borderWidth: 1, borderColor: color },
        animatedStyle,
      ]}
    />
  );
}

export default function BETinaAvatar({
  size = 52,
  pulse = false,
  online = false,
  variant = 'default',
  style,
}: Props) {
  const pad = Math.max(2, size * 0.02);
  return (
    <View style={[{ width: size, height: size }, style]}>
      {pulse && (
        <>
          <PulseRing size={size} delay={0} color={withAlpha(Colors.primary, 0.5)} />
          <PulseRing size={size} delay={1300} color={withAlpha(Colors.accent, 0.6)} />
        </>
      )}
      <LinearGradient
        colors={RING_COLORS[variant]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={{ width: size, height: size, borderRadius: size / 2, padding: pad }}
      >
        <Image
          source={require('../../assets/betina-avatar.png')}
          style={{ width: '100%', height: '100%', borderRadius: size / 2 }}
          resizeMode="cover"
        />
      </LinearGradient>
      {online && (
        <View
          style={[
            styles.onlineDot,
            { width: size * 0.24, height: size * 0.24, borderRadius: size * 0.12 },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  onlineDot: {
    position: 'absolute',
    right: 0,
    bottom: 2,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.background,
  },
});
