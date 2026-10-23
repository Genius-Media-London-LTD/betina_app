import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import BETinaAvatar from './BETinaAvatar';
import { BorderRadius, Colors, Fonts, Spacing, Typography, withAlpha } from '../theme';

type Props = {
  role: 'user' | 'assistant';
  children: React.ReactNode;
  /** Hide the small avatar next to assistant bubbles (e.g. hint bubbles) */
  showAvatar?: boolean;
  style?: ViewStyle;
};

/** Chat bubble in BETina style — purple glass for BETina, neon glass for the user. */
export default function ChatBubble({ role, children, showAvatar = true, style }: Props) {
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
      {showAvatar && <BETinaAvatar size={30} />}
      <View style={[styles.bubble, styles.assistant, !showAvatar && { marginLeft: 0 }]}>
        {content}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    maxWidth: '85%',
  },
  bubble: {
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
  },
  assistant: {
    backgroundColor: withAlpha(Colors.accent, 0.16),
    borderWidth: 1,
    borderColor: withAlpha(Colors.accent, 0.3),
    borderBottomLeftRadius: 4,
    flexShrink: 1,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 3,
  },
  user: {
    alignSelf: 'flex-end',
    maxWidth: '78%',
    backgroundColor: withAlpha(Colors.primary, 0.14),
    borderWidth: 1,
    borderColor: withAlpha(Colors.primary, 0.45),
    borderBottomRightRadius: 4,
  },
  text: {
    color: Colors.textPrimary,
    fontSize: Typography.base - 1,
    fontFamily: Fonts.medium,
    lineHeight: 21,
  },
  userText: {
    color: Colors.primaryLight,
  },
});
