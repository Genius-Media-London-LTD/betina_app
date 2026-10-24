import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Fonts, Typography } from '../theme';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  leftElement?: React.ReactNode;
  /** Replaces the default arrow of the primary CTA. */
  rightElement?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
};

/**
 * Urban buttons. Primary = lime block, black Anton label left, arrow right.
 * Ghost = 1.5px graphite outline. Danger = red outline (sign-out).
 */
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
  const handlePress = () => {
    if (disabled || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress?.();
  };
  const primary = variant === 'primary';

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && (primary ? styles.primaryPressed : styles.outlinePressed),
        disabled && styles.disabled,
        style,
      ]}
    >
      {leftElement && <View style={styles.side}>{leftElement}</View>}
      <Text
        style={[styles.label, primary ? styles.primaryLabel : styles.outlineLabel, variant === 'danger' && styles.dangerLabel]}
        numberOfLines={1}
      >
        {loading ? '…' : label.toUpperCase()}
      </Text>
      {rightElement ? (
        <View style={styles.side}>{rightElement}</View>
      ) : primary ? (
        <Text style={styles.arrow}>→</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 15,
    paddingHorizontal: 18,
  },
  primary: { backgroundColor: Colors.primary },
  primaryPressed: { backgroundColor: Colors.primaryDim },
  ghost: { borderWidth: 1.5, borderColor: Colors.borderStrong, justifyContent: 'center' },
  danger: { borderWidth: 1.5, borderColor: Colors.danger, justifyContent: 'center' },
  outlinePressed: { backgroundColor: Colors.cardElevated },
  disabled: { opacity: 0.4 },
  label: { flexShrink: 1 },
  primaryLabel: { color: Colors.black, fontSize: 22, fontFamily: Fonts.display, letterSpacing: 0.4 },
  outlineLabel: { color: Colors.textPrimary, fontSize: Typography.base, fontFamily: Fonts.label, letterSpacing: 0.8 },
  dangerLabel: { color: Colors.danger },
  arrow: { color: Colors.black, fontSize: 22, fontFamily: Fonts.bold, marginTop: -2 },
  side: { flexDirection: 'row', alignItems: 'center' },
});
