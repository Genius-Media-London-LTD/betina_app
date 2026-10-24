import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { Colors } from '../theme';

type Props = ViewProps & {
  // Kept for compatibility with the glow era; the urban look is plain black.
  glowTop?: number;
  glowColor?: 'accent' | 'gold' | 'green';
  glowSize?: number;
  orbs?: boolean;
};

/** Screen background: pure black — no glow, no gradients (urban design rule). */
export default function ScreenBg({ style, children, glowTop, glowColor, glowSize, orbs, ...rest }: Props) {
  return (
    <View style={[styles.root, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
    overflow: 'hidden',
  },
});
