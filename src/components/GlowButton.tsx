import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Animation, BorderRadius, Colors, Fonts, Shadows, Spacing, Typography, withAlpha } from '../theme';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
};

export default function GlowButton({
  label,
  onPress,
  variant = 'primary',
  leftElement,
  rightElement,
  disabled,
  loading,
  style,
}: Props) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = () => {
    if (disabled || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress?.();
  };

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.97, Animation.spring.snappy);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, Animation.spring.snappy);
        }}
        onPress={handlePress}
        disabled={disabled || loading}
        style={[styles.base, styles[variant], disabled && styles.disabled]}
      >
        {leftElement && <View style={styles.side}>{leftElement}</View>}
        <Text style={[styles.label, variant === 'ghost' && styles.ghostLabel, variant === 'danger' && styles.dangerLabel]}>
          {loading ? '…' : label}
        </Text>
        {rightElement && <View style={styles.side}>{rightElement}</View>}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderRadius: BorderRadius.xl,
    paddingVertical: 17,
    paddingHorizontal: Spacing.xl,
  },
  primary: {
    backgroundColor: Colors.primary,
    ...Shadows.green,
  },
  ghost: {
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: withAlpha(Colors.white, 0.1),
  },
  danger: {
    backgroundColor: withAlpha(Colors.danger, 0.08),
    borderWidth: 1,
    borderColor: withAlpha(Colors.danger, 0.3),
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    color: Colors.background,
    fontSize: Typography.md - 1,
    fontFamily: Fonts.bold,
  },
  ghostLabel: {
    color: Colors.textPrimary,
    fontSize: Typography.base - 1,
    fontFamily: Fonts.semibold,
  },
  dangerLabel: {
    color: Colors.danger,
    fontSize: Typography.base - 1,
    fontFamily: Fonts.bold,
  },
  side: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
