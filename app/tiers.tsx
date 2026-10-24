import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import BackButton from '../src/components/BackButton';
import BETinaAvatar from '../src/components/BETinaAvatar';
import ScreenBg from '../src/components/ScreenBg';
import XPBar from '../src/components/XPBar';
import { Meta, OutlineNumber } from '../src/components/Urban';
import { tiers } from '../src/lib/demo';
import { useProfile } from '../src/hooks/useProfile';
import { useI18n } from '../src/lib/i18n';
import { Colors, Fonts } from '../src/theme';

export default function Tiers() {
  const { t, lang } = useI18n();
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();

  // Derive the real tier + progress from the player's actual XP.
  const xp = profile?.xp_points ?? 0;
  let currentIndex = 0;
  for (let i = 0; i < tiers.length; i++) if (xp >= tiers[i].minXp) currentIndex = i;
  const nextTier = tiers[currentIndex + 1] ?? null;
  const progress = nextTier
    ? Math.min(1, Math.max(0, (xp - tiers[currentIndex].minXp) / (nextTier.minXp - tiers[currentIndex].minXp)))
    : 1;
  const fmt = (n: number) => n.toLocaleString(lang);
  const words = t.tiersHeadline.toUpperCase().split(' ');

  return (
    <ScreenBg>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <BackButton />
          <Meta color={Colors.primary}>{`${tiers.length} TIERS`}</Meta>
        </View>

        <View>
          <Text style={styles.headline}>{words.slice(0, -1).join(' ')}</Text>
          <Text style={[styles.headline, { color: Colors.primary }]}>{words[words.length - 1]}</Text>
          <Text style={styles.subtitle}>{t.tiersSubtitle}</Text>
        </View>

        {tiers.map((tier, i) => {
          const done = i < currentIndex;
          const current = i === currentIndex;
          const ink = current ? Colors.black : Colors.white;
          return (
            <Animated.View key={tier.name} entering={FadeInDown.delay(80 + i * 70).duration(450)}>
              <View style={[styles.tier, current && styles.tierCurrent, tier.gold && !current && styles.tierGold]}>
                <OutlineNumber
                  value={String(i + 1).padStart(2, '0')}
                  size={40}
                  color={current ? Colors.black : Colors.primary}
                  fill={current ? Colors.primary : Colors.black}
                />
                <View style={styles.info}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.name, { color: done ? Colors.textMuted : ink }]}>{tier.name}</Text>
                    {current && (
                      <View style={styles.you}>
                        <Text style={styles.youText}>{t.tiersYou.toUpperCase()}</Text>
                      </View>
                    )}
                  </View>
                  <Meta color={current ? Colors.black : Colors.textMuted}>
                    {tier.maxXp != null ? `${fmt(tier.minXp)} – ${fmt(tier.maxXp)} XP` : `${fmt(tier.minXp)}+ XP · ${t.tiersTop1}`}
                  </Meta>
                  {current && (
                    <View style={styles.progress}>
                      <XPBar progress={progress} height={8} onLime />
                      <Meta color={Colors.black} style={{ fontFamily: Fonts.monoBold }}>
                        {nextTier ? `${fmt(xp)} XP · ${fmt(nextTier.minXp - xp)} → ${nextTier.name}` : `${fmt(xp)} XP`}
                      </Meta>
                    </View>
                  )}
                </View>
                <View style={styles.cashback}>
                  <Text style={[styles.cashbackValue, { color: tier.cashback === '—' ? Colors.textMuted : ink }]}>{tier.cashback}</Text>
                  <Meta color={current ? Colors.black : Colors.textMuted} size={8}>{t.tiersCashback}</Meta>
                </View>
              </View>
            </Animated.View>
          );
        })}

        <View style={styles.spacer} />

        <Animated.View entering={FadeInDown.delay(500).duration(450)} style={styles.note}>
          <BETinaAvatar size={36} />
          <Text style={styles.noteText}>{t.tiersNote}</Text>
        </Animated.View>
      </ScrollView>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: 16, gap: 10 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  headline: { color: Colors.white, fontSize: 62, lineHeight: 60, fontFamily: Fonts.display },
  subtitle: { color: Colors.textSecondary, fontSize: 15, lineHeight: 21, fontFamily: Fonts.medium, marginTop: 8, marginBottom: 6 },
  tier: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  tierCurrent: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tierGold: { borderColor: Colors.primary },
  info: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 28, lineHeight: 30, fontFamily: Fonts.display },
  you: { backgroundColor: Colors.black, paddingHorizontal: 6, paddingVertical: 1 },
  youText: { color: Colors.primary, fontSize: 11, fontFamily: Fonts.monoBold },
  progress: { gap: 6, marginTop: 4 },
  cashback: { alignItems: 'flex-end', minWidth: 58 },
  cashbackValue: { fontSize: 32, lineHeight: 34, fontFamily: Fonts.display },
  spacer: { flex: 1, minHeight: 12 },
  note: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  noteText: { flex: 1, color: Colors.textSecondary, fontSize: 13, lineHeight: 19, fontFamily: Fonts.medium },
});
