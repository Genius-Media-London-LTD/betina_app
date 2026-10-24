import React from 'react';
import { StyleSheet, Text, TextProps } from 'react-native';
import { Colors, Fonts, Typography } from '../theme';

/** Space Mono meta label, uppercase with wide tracking ("// TOP STORIES", "HEUTE", …). */
export default function SectionLabel({ style, children, ...rest }: TextProps) {
  return (
    <Text style={[styles.label, style]} {...rest}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  label: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontFamily: Fonts.mono,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
  },
});
