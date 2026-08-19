import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import BETinaAvatar from './BETinaAvatar';
import GlowButton from './GlowButton';
import ParticlesBg from './ParticlesBg';
import ScreenBg from './ScreenBg';
import { useI18n } from '../lib/i18n';
import { Colors, Fonts, Spacing, Typography } from '../theme';

/**
 * Gate shown on account-based tabs when the visitor is browsing as a guest.
 * Non-account content (news / articles) stays open; this only fronts the
 * features that genuinely need an account (Apple Guideline 5.1.1(v)).
 */
export default function SignInWall({ body }: { body?: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ScreenBg glowTop={0.3} glowSize={480}>
      <ParticlesBg count={8} />
      <View
        style={[
          styles.content,
          { paddingTop: insets.top + Spacing.base, paddingBottom: insets.bottom + 130 },
        ]}
      >
        <View style={{ flex: 0.9 }} />

        <Animated.View entering={FadeInDown.duration(700)}>
          <BETinaAvatar size={128} pulse />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).duration(700)} style={styles.textBlock}>
          <Text style={styles.title}>{t.guestTitle}</Text>
          <Text style={styles.body}>{body ?? t.guestBody}</Text>
        </Animated.View>

        <View style={{ flex: 1 }} />

        <Animated.View entering={FadeInDown.delay(300).duration(700)} style={styles.ctaWrap}>
          <GlowButton label={t.guestCta} onPress={() => router.replace('/(auth)/login')} />
        </Animated.View>
      </View>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  textBlock: {
    alignItems: 'center',
    gap: Spacing.sm + 2,
    paddingTop: 26,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 26,
    fontFamily: Fonts.bold,
    textAlign: 'center',
  },
  body: {
    color: Colors.textSecondary,
    fontSize: Typography.base,
    fontFamily: Fonts.medium,
    textAlign: 'center',
    lineHeight: 23,
    maxWidth: 300,
  },
  ctaWrap: {
    width: '100%',
  },
});
