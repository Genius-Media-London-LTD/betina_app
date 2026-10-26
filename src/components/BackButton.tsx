import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors, Fonts } from '../theme';

/** Urban header button: 38×38, 1.5px graphite outline, white arrow. */
export default function BackButton({ onPress }: { onPress?: () => void }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (onPress) onPress();
        else if (router.canGoBack()) router.back();
        // Opened directly (deep link, page reload on web): there is no history — go home.
        else router.replace('/(tabs)');
      }}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      hitSlop={8}
      accessibilityRole="button"
    >
      <Text style={styles.arrow}>←</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 38,
    height: 38,
    borderWidth: 1.5,
    borderColor: Colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { backgroundColor: Colors.cardElevated },
  arrow: { color: Colors.white, fontSize: 18, fontFamily: Fonts.bold, marginTop: -2 },
});
