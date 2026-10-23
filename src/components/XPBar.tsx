import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { Animation, Colors, withAlpha } from '../theme';

type Props = {
  /** 0..1 */
  progress: number;
  height?: number;
  delay?: number;
};

/** Neon XP progress bar — fills with an animated sweep on mount. */
export default function XPBar({ progress, height = 8, delay = 300 }: Props) {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withDelay(
      delay,
      withTiming(progress, { duration: Animation.cinematic, easing: Easing.out(Easing.cubic) }),
    );
  }, [progress, delay, width]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
  }));

  return (
    <View style={[styles.track, { height, borderRadius: height }]}>
      <Animated.View style={[styles.fill, { height, borderRadius: height }, fillStyle]}>
        <LinearGradient
          colors={[Colors.primaryDim, Colors.primary]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[StyleSheet.absoluteFill, { borderRadius: height }]}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    backgroundColor: withAlpha(Colors.white, 0.08),
    overflow: 'hidden',
  },
  fill: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
});
