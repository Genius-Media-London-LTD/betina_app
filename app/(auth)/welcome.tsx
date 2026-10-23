import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import AnimatedNumber from '../../src/components/AnimatedNumber';
import BETinaAvatar from '../../src/components/BETinaAvatar';
import GlowButton from '../../src/components/GlowButton';
import GlowCard from '../../src/components/GlowCard';
import ParticlesBg from '../../src/components/ParticlesBg';
import ScreenBg from '../../src/components/ScreenBg';
import { useI18n } from '../../src/lib/i18n';
import { Colors, Fonts, Spacing, Typography } from '../../src/theme';

export default function Welcome() {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { name, team } = useLocalSearchParams<{ name: string; team?: string }>();
  const displayName = name?.trim() || 'friend';
  const teamParam = team?.trim() || null;

  return (
    <ScreenBg glowTop={0.38} glowSize={500}>
      <ParticlesBg count={10} />
      <View
        style={[
          styles.content,
          { paddingTop: insets.top + Spacing.base, paddingBottom: insets.bottom + Spacing['2xl'] },
        ]}
      >
        <View style={{ flex: 0.8 }} />

        <Animated.View entering={FadeInDown.duration(900)}>
          <BETinaAvatar size={150} pulse />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(250).duration(900)} style={styles.headlineBlock}>
          <Text style={styles.headline}>{t.welcomeTitle}, {displayName}! 👋</Text>
          <Text style={styles.sub}>
            {t.welcomeSubtitle}
            {teamParam ? ` 🏟 ${teamParam}` : ''}
          </Text>
        </Animated.View>

        {/* starter rewards */}
        <Animated.View entering={FadeInDown.delay(450).duration(900)} style={styles.rewards}>
          <GlowCard style={styles.rewardCard}>
            <AnimatedNumber value={100} prefix="+" suffix=" XP" style={styles.rewardValueGreen} delay={800} />
            <Text style={styles.rewardLabel}>{t.welcomeBonus}</Text>
          </GlowCard>
          <GlowCard style={styles.rewardCard}>
            <Text style={styles.rewardValue}>INITIATE</Text>
            <Text style={styles.rewardLabel}>{t.welcomeTier}</Text>
          </GlowCard>
        </Animated.View>

        <View style={{ flex: 1 }} />

        <Animated.View entering={FadeInDown.delay(650).duration(900)} style={styles.ctaWrap}>
          <GlowButton label={t.registerBtn} onPress={() => router.replace('/(tabs)')} />
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
  headlineBlock: {
    alignItems: 'center',
    gap: Spacing.sm + 2,
    paddingTop: 28,
  },
  headline: {
    color: Colors.white,
    fontSize: 30,
    fontFamily: Fonts.bold,
    textAlign: 'center',
  },
  sub: {
    color: Colors.textSecondary,
    fontSize: Typography.base,
    fontFamily: Fonts.medium,
    textAlign: 'center',
    lineHeight: 23,
    maxWidth: 280,
  },
  rewards: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingTop: 30,
    width: '100%',
  },
  rewardCard: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 18,
    paddingHorizontal: Spacing.sm + 2,
  },
  rewardValueGreen: {
    color: Colors.primary,
    fontSize: 22,
    fontFamily: Fonts.bold,
  },
  rewardValue: {
    color: Colors.white,
    fontSize: 22,
    fontFamily: Fonts.bold,
  },
  rewardLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.xs + 1,
    fontFamily: Fonts.semibold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  ctaWrap: {
    width: '100%',
  },
});
