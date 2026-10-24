import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '../theme';

type Props = {
  value: boolean;
  onValueChange?: (v: boolean) => void;
};

/** Square urban toggle (46×24, 17px knob): on = lime track + black knob. */
export default function Toggle({ value, onValueChange }: Props) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onValueChange?.(!value);
      }}
      hitSlop={6}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
    >
      <View style={[styles.track, value ? styles.trackOn : styles.trackOff]}>
        <View style={[styles.knob, value ? styles.knobOn : styles.knobOff]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: { width: 46, height: 24, justifyContent: 'center', paddingHorizontal: 2.5 },
  trackOn: { backgroundColor: Colors.primary, borderWidth: 1.5, borderColor: Colors.primary },
  trackOff: { backgroundColor: Colors.black, borderWidth: 1.5, borderColor: Colors.borderStrong },
  knob: { width: 17, height: 17 },
  knobOn: { backgroundColor: Colors.black, alignSelf: 'flex-end' },
  knobOff: { backgroundColor: Colors.textFaint, alignSelf: 'flex-start' },
});
