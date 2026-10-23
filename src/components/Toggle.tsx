import React, { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Animation, Colors, withAlpha } from '../theme';

type Props = {
  value: boolean;
  onValueChange?: (v: boolean) => void;
};

/** Custom neon toggle matching the design (46×28, knob flips color). */
export default function Toggle({ value, onValueChange }: Props) {
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(value ? 1 : 0, Animation.spring.snappy);
  }, [value, progress]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [withAlpha(Colors.white, 0.12), Colors.primary],
    ),
  }));

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * 18 }],
    backgroundColor: interpolateColor(progress.value, [0, 1], [Colors.textMuted, Colors.background]),
  }));

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onValueChange?.(!value);
      }}
      hitSlop={6}
    >
      <Animated.View style={[styles.track, trackStyle]}>
        <Animated.View style={[styles.knob, knobStyle]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 46,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  knob: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
});
