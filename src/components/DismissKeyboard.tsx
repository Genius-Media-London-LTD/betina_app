import React from 'react';
import { Keyboard, Platform, TouchableWithoutFeedback } from 'react-native';

/**
 * Tap anywhere outside an input to close the soft keyboard (native only).
 *
 * iPad review: the numeric keypad has no "done" key, so without this the
 * keyboard couldn't be dismissed. On web there's no soft keyboard, and the
 * TouchableWithoutFeedback wrapper becomes a focusable element that steals
 * focus from the inputs (you couldn't type the phone number) — so on web the
 * children are rendered as-is.
 */
export default function DismissKeyboard({ children }: { children: React.ReactElement }) {
  if (Platform.OS === 'web') return children;
  return (
    <TouchableWithoutFeedback accessible={false} onPress={() => Keyboard.dismiss()}>
      {children}
    </TouchableWithoutFeedback>
  );
}
