import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import BETinaAvatar from './BETinaAvatar';
import { Colors, Fonts, Spacing, Typography } from '../theme';

type Props = {
  role: 'user' | 'assistant';
  children: React.ReactNode;
  /** Show BETina's small portrait next to her bubble */
  showAvatar?: boolean;
  style?: ViewStyle;
};

/** Urban chat bubble — BETina: #111 with a graphite border; player: lime with black text. */
export default function ChatBubble({ role, children, showAvatar = false, style }: Props) {
  const content =
    typeof children === 'string' ? (
      <Text style={[styles.text, role === 'user' && styles.userText]}>{children}</Text>
    ) : (
      children
    );

  if (role === 'user') {
    return <View style={[styles.bubble, styles.user, style]}>{content}</View>;
  }
  return (
    <View style={[styles.row, style]}>
      {showAvatar && <BETinaAvatar size={28} />}
      <View style={[styles.bubble, styles.assistant]}>{content}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    maxWidth: '86%',
  },
  bubble: {
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  assistant: {
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
    flexShrink: 1,
  },
  user: {
    alignSelf: 'flex-end',
    maxWidth: '80%',
    backgroundColor: Colors.primary,
  },
  text: {
    color: Colors.textPrimary,
    fontSize: Typography.base,
    fontFamily: Fonts.regular,
    lineHeight: 21,
  },
  userText: {
    color: Colors.black,
    fontFamily: Fonts.semibold,
  },
});
