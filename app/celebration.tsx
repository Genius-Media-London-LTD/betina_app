import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import BETinaAvatar from '../src/components/BETinaAvatar';
import GlowButton from '../src/components/GlowButton';
import GlowCard from '../src/components/GlowCard';
import ParticlesBg from '../src/components/ParticlesBg';
import ScreenBg from '../src/components/ScreenBg';
import { demoProfile } from '../src/lib/demo';
import { Colors, Fonts, Spacing, Typography, withAlpha } from '../src/theme';

// No "Big Win" variant by design — win/loss messaging stays off this app
// so it reads as an AI companion, not a gambling app (App Store safety).
type CelebrationType = 'tierup' | 'birthday';

export default function Celebration() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ type?: string }>();
  const type = ((params.type as CelebrationType) || 'tierup') satisfies CelebrationType;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const dismiss = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  const config = {
    tierup: {
      glow: 'gold' as const,
      particles: 'gold' as const,
      avatarVariant: 'gold' as const,
      emoji: '🎉',
      kicker: 'TIER UP',
      kickerColor: Colors.gold,
      headline: 'ANALYST',
      sub: `You crossed 3,000 XP, ${demoProfile.name}. I knew you had it in you. 🧠`,
      cta: 'Claim rewards',
      dismissLabel: 'Maybe later',
    },
    birthday: {
      glow: 'gold' as const,
      particles: 'gold' as const,
      avatarVariant: 'gold' as const,
      emoji: '🥳',
      kicker: 'MARCH 14',
      kickerColor: Colors.accent,
      headline: `Happy Birthday,\n${demoProfile.name}! 🎂`,
      sub: '32 today! I baked you something special — no calories, all XP.',
      cta: 'Unwrap my gift 🎁',
      dismissLabel: 'Thanks, BETina ♥',
    },
  }[type];

  return (
    <ScreenBg glowTop={0.4} glowSize={520} glowColor={config.glow}>
      <ParticlesBg count={12} variant={config.particles} confetti />

      <View
        style={[
          styles.content,
          { paddingTop: insets.top + Spacing.base, paddingBottom: insets.bottom + Spacing['2xl'] },
        ]}
      >
        <View style={{ flex: 0.7 }} />

        {/* BETina celebrates */}
        <Animated.View entering={FadeInDown.duration(900)} style={styles.avatarWrap}>
          <BETinaAvatar size={140} pulse variant={config.avatarVariant} />
          <Animated.Text entering={FadeInDown.delay(400).duration(700)} style={styles.avatarEmoji}>
            {config.emoji}
          </Animated.Text>
        </Animated.View>

        {/* headline */}
        <Animated.View entering={FadeInDown.delay(250).duration(900)} style={styles.headlineBlock}>
          <Text style={[styles.kicker, { color: config.kickerColor }]}>{config.kicker}</Text>
          <Text
            style={[
              styles.headline,
              type === 'birthday' && styles.headlineBirthday,
              type === 'tierup' && styles.headlineGold,
            ]}
          >
            {config.headline}
          </Text>
          <Text style={styles.sub}>{config.sub}</Text>
        </Animated.View>

        {/* context / rewards */}
        <Animated.View entering={FadeInDown.delay(500).duration(900)} style={styles.middle}>
          {type === 'tierup' && (
            <View style={styles.rewardsRow}>
              <GlowCard variant="gold" style={styles.rewardCard}>
                <Text style={styles.rewardValueGold}>4%</Text>
                <Text style={styles.rewardLabel}>Cashback tier</Text>
              </GlowCard>
              <GlowCard style={styles.rewardCard}>
                <Text style={styles.rewardValueGreen}>+250 XP</Text>
                <Text style={styles.rewardLabel}>Tier bonus</Text>
              </GlowCard>
              <GlowCard style={styles.rewardCard}>
                <Text style={styles.rewardEmoji}>🏅</Text>
                <Text style={styles.rewardLabel}>New badge</Text>
              </GlowCard>
            </View>
          )}
          {type === 'birthday' && (
            <GlowCard variant="gold" style={styles.giftCard}>
              <Text style={styles.giftEmoji}>🎁</Text>
              <View style={styles.contextText}>
                <Text style={styles.contextTitle}>Birthday gift unlocked</Text>
                <Text style={styles.contextMeta}>Double XP all day + exclusive badge</Text>
              </View>
              <Text style={styles.giftXp}>×2 XP</Text>
            </GlowCard>
          )}
        </Animated.View>

        <View style={{ flex: 1 }} />

        <Animated.View entering={FadeInDown.delay(700).duration(900)} style={styles.ctaBlock}>
          <GlowButton label={config.cta} onPress={dismiss} />
          <Pressable onPress={dismiss} hitSlop={8} style={styles.dismiss}>
            <Text style={styles.dismissLabel}>{config.dismissLabel}</Text>
          </Pressable>
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
  avatarWrap: {
    position: 'relative',
  },
  avatarEmoji: {
    position: 'absolute',
    right: -8,
    top: -4,
    fontSize: 30,
  },
  headlineBlock: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: 26,
  },
  kicker: {
    fontSize: Typography.xs + 1,
    fontFamily: Fonts.bold,
    letterSpacing: 2.5,
  },
  headline: {
    color: Colors.white,
    fontSize: 44,
    fontFamily: Fonts.bold,
    textAlign: 'center',
    textShadowColor: withAlpha(Colors.primary, 0.3),
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 40,
  },
  headlineGold: {
    textShadowColor: withAlpha(Colors.gold, 0.35),
    letterSpacing: 1.5,
  },
  headlineBirthday: {
    fontSize: 34,
    lineHeight: 40,
    textShadowColor: withAlpha(Colors.accent, 0.4),
  },
  sub: {
    color: Colors.textSecondary,
    fontSize: Typography.sm + 1,
    fontFamily: Fonts.medium,
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 290,
  },
  middle: {
    width: '100%',
    paddingTop: 28,
  },
  rewardsRow: {
    flexDirection: 'row',
    gap: Spacing.sm + 2,
  },
  rewardCard: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
    paddingVertical: 16,
    paddingHorizontal: Spacing.sm,
  },
  rewardValueGold: {
    color: Colors.gold,
    fontSize: Typography.lg - 1,
    fontFamily: Fonts.bold,
  },
  rewardValueGreen: {
    color: Colors.primary,
    fontSize: Typography.lg - 1,
    fontFamily: Fonts.bold,
  },
  rewardEmoji: {
    fontSize: Typography.lg - 1,
  },
  rewardLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.xs,
    fontFamily: Fonts.semibold,
    letterSpacing: 0.6,
    textAlign: 'center',
  },
  contextText: {
    flex: 1,
    gap: 2,
  },
  contextTitle: {
    color: Colors.white,
    fontSize: Typography.sm + 1,
    fontFamily: Fonts.bold,
  },
  contextMeta: {
    color: Colors.textSecondary,
    fontSize: Typography.xs + 1,
    fontFamily: Fonts.medium,
  },
  giftCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  giftEmoji: { fontSize: 32 },
  giftXp: {
    color: Colors.gold,
    fontSize: Typography.base + 1,
    fontFamily: Fonts.bold,
  },
  ctaBlock: {
    width: '100%',
    gap: Spacing.sm + 2,
  },
  dismiss: {
    alignItems: 'center',
  },
  dismissLabel: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
    fontFamily: Fonts.medium,
  },
});
