import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { Colors } from '../theme';

type Variant = 'glass' | 'accent' | 'gold' | 'green';

type Props = ViewProps & {
  variant?: Variant;
};

const BORDER: Record<Variant, string> = {
  glass: Colors.border,
  accent: Colors.borderStrong,
  gold: Colors.gold,
  green: Colors.primary,
};

/** Flat urban card: #111 surface, hard 1.5px border (lime / gold for highlights). */
export default function GlowCard({ variant = 'glass', style, children, ...rest }: Props) {
  return (
    <View style={[styles.card, { borderColor: BORDER[variant] }, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderWidth: 1.5,
  },
});
