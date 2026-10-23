import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import BackButton from '../src/components/BackButton';
import BETinaAvatar from '../src/components/BETinaAvatar';
import GlowCard from '../src/components/GlowCard';
import ScreenBg from '../src/components/ScreenBg';
import XPBar from '../src/components/XPBar';
import { tiers } from '../src/lib/demo';
import { useProfile } from '../src/hooks/useProfile';
import { useI18n } from '../src/lib/i18n';
import { Colors, Fonts, Spacing, Typography } from '../src/theme';

export default function Tiers() {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();

  // Derive the real tier + progress from the player's actual XP (was showing
  // hardcoded demo values — THINKER/2,340 XP — regardless of the real profile).
  const xp = profile?.xp_points ?? 0;
  let currentIndex = 0;
  for (let i = 0; i < tiers.length; i++) if (xp >= tiers[i].minXp) currentIndex = i;
  const nextTier = tiers[currentIndex + 1] ?? null;
  const progress = nextTier
    ? Math.min(1, Math.max(0, (xp - tiers[currentIndex].minXp) / (nextTier.minXp - tiers[currentIndex].minXp)))
    : 1;

  return (
    <ScreenBg glowTop={0.14} glowSize={460}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.base, paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* top bar */}
        <View style={styles.topBar}>
          <BackButton />
          <View style={styles.topText}>
            <Text style={styles.title}>{t.tiersTitle}</Text>
            <Text style={styles.subtitle}>{t.tiersSubtitle}</Text>
          </View>
        </View>

        {tiers.map((tier, i) => {
          const done = i < currentIndex;
          const current = i === currentIndex;
          return (
            <Animated.View key={tier.name} entering={FadeInDown.delay(80 + i * 70).duration(450)}>
              <GlowCard
                variant={current ? 'green' : tier.gold ? 'gold' : 'glass'}
                style={[styles.tierCard, done && { opacity: 0.7 }]}
              >
                <View style={styles.tierRow}>
                  <View
                    style={[
                      styles.tierBadge,
                      done && styles.tierBadgeDone,
                      current && styles.tierBadgeCurrent,
                      tier.gold && styles.tierBadgeGold,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tierBadgeLabel,
                        done && { color: Colors.primary },
                        current && { color: Colors.background, fontSize: 15 },
                        tier.gold && { fontSize: 16 },
                      ]}
                    >
                      {tier.gold ? '👑' : done ? '✓' : current ? '★' : i + 1}
                    </Text>
                  </View>
                  <View style={styles.tierInfo}>
                    <View style={styles.tierNameRow}>
                      <Text style={[styles.tierName, tier.gold && { color: Colors.gold }]}>
                        {tier.name}
                      </Text>
                      {current && (
                        <View style={styles.currentPill}>
                          <Text style={styles.currentPillLabel}>{t.journeyCurrentTier}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.tierRange}>
                      {tier.maxXp
                        ? `${tier.minXp.toLocaleString('en-US')} – ${tier.maxXp.toLocaleString('en-US')} XP`
                        : `${tier.minXp.toLocaleString('en-US')}+ XP · ${t.tiersTop1}`}
                    </Text>
                  </View>
                  <View style={styles.cashback}>
                    <Text
                      style={[
                        styles.cashbackValue,
                        current && { color: Colors.primary },
                        tier.gold && { color: Colors.gold },
                      ]}
                    >
                      {tier.cashback}
                    </Text>
                    <Text style={styles.cashbackLabel}>{t.tiersCashback}</Text>
                  </View>
                </View>
                {current && (
                  <View style={styles.progressBlock}>
                    <XPBar progress={progress} height={6} />
                    <Text style={styles.progressMeta}>
                      {xp.toLocaleString('en-US')} XP
                      {nextTier ? ` · ${(nextTier.minXp - xp).toLocaleString('en-US')} to ${nextTier.name}` : ''}
                    </Text>
                  </View>
                )}
              </GlowCard>
            </Animated.View>
          );
        })}

        <View style={styles.spacer} />

        {/* BETina note */}
        <Animated.View entering={FadeInDown.delay(500).duration(450)} style={styles.note}>
          <BETinaAvatar size={32} />
          <Text style={styles.noteText}>
            {t.tiersNote}
          </Text>
        </Animated.View>
      </ScrollView>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  topText: { gap: 1, flex: 1 },
  title: {
    color: '#FFFFFF',
    fontSize: Typography.lg + 2,
    fontFamily: Fonts.bold,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: Typography.xs + 1,
    fontFamily: Fonts.medium,
  },
  tierCard: {
    padding: 16,
    gap: Spacing.md,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  tierBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.glass,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierBadgeDone: {
    backgroundColor: 'rgba(184,233,38,0.12)',
    borderColor: 'rgba(184,233,38,0.5)',
  },
  tierBadgeCurrent: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  tierBadgeGold: {
    backgroundColor: 'rgba(255,215,0,0.12)',
    borderColor: 'rgba(255,215,0,0.5)',
  },
  tierBadgeLabel: {
    color: '#55556A',
    fontSize: Typography.sm,
    fontFamily: Fonts.bold,
  },
  tierInfo: {
    flex: 1,
    gap: 1,
  },
  tierNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  tierName: {
    color: '#FFFFFF',
    fontSize: Typography.sm + 1,
    fontFamily: Fonts.bold,
    letterSpacing: 0.7,
  },
  currentPill: {
    backgroundColor: 'rgba(184,233,38,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(184,233,38,0.4)',
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 9,
  },
  currentPillLabel: {
    color: Colors.primary,
    fontSize: 10,
    fontFamily: Fonts.bold,
  },
  tierRange: {
    color: Colors.textSecondary,
    fontSize: Typography.xs + 1,
    fontFamily: Fonts.medium,
  },
  cashback: {
    alignItems: 'flex-end',
    gap: 1,
  },
  cashbackValue: {
    color: '#FFFFFF',
    fontSize: Typography.base + 2,
    fontFamily: Fonts.bold,
  },
  cashbackLabel: {
    color: '#55556A',
    fontSize: 10,
    fontFamily: Fonts.semibold,
    letterSpacing: 0.8,
  },
  progressBlock: {
    gap: 6,
  },
  progressMeta: {
    color: '#55556A',
    fontSize: Typography.xs,
    fontFamily: Fonts.medium,
  },
  spacer: {
    flex: 1,
    minHeight: Spacing.base,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm + 2,
    backgroundColor: 'rgba(139,92,246,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.4)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  noteText: {
    flex: 1,
    color: '#E8E8F0',
    fontSize: Typography.xs + 1,
    fontFamily: Fonts.medium,
    lineHeight: 18,
  },
});
