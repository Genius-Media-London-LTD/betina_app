import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts, withAlpha } from '../theme';

type Props = {
  short: string;
  size?: number;
};

/** Circular team crest placeholder (FCB blaugrana split, RMA white, generic dark). */
export default function TeamBadge({ short, size = 40 }: Props) {
  const fontSize = size * 0.28;

  if (short === 'FCB') {
    return (
      <LinearGradient
        colors={['#A50044', '#A50044', '#004D98', '#004D98']}
        locations={[0, 0.5, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.badge, { width: size, height: size, borderRadius: size / 2 }]}
      >
        <Text style={[styles.label, { fontSize, color: Colors.gold }]}>FCB</Text>
      </LinearGradient>
    );
  }
  if (short === 'RMA') {
    return (
      <View
        style={[
          styles.badge,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: Colors.white },
        ]}
      >
        <Text style={[styles.label, { fontSize, color: Colors.accent }]}>RMA</Text>
      </View>
    );
  }
  return (
    <View
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: withAlpha(Colors.white, 0.08),
          borderWidth: 1,
          borderColor: withAlpha(Colors.white, 0.15),
        },
      ]}
    >
      <Text style={[styles.label, { fontSize, color: Colors.textSecondary }]}>{short}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: Fonts.bold,
  },
});
