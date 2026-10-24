import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackButton from '../src/components/BackButton';
import BETinaAvatar from '../src/components/BETinaAvatar';
import GlowCard from '../src/components/GlowCard';
import ScreenBg from '../src/components/ScreenBg';
import SectionLabel from '../src/components/SectionLabel';
import { Colors, Fonts, Spacing, Typography, withAlpha } from '../src/theme';

const FAQS = [
  {
    q: 'How do I earn XP?',
    a: 'Through activity: daily check-ins, chatting with BETina, following events and keeping your streak. Never by spending money.',
  },
  { q: 'What are VIP tiers?', a: 'Five activity levels — INITIATE to GENIUS. Higher tiers unlock better cashback rates on GeniusBet.' },
  { q: 'How is cashback redeemed?', a: 'Cashback is redeemed directly on the GeniusBet website — BETina just tracks your tier.' },
  { q: 'Can I change my phone number?', a: 'Yes — contact support via live chat and we’ll move your account safely.' },
];

export default function Help() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <ScreenBg glowTop={0.12} glowSize={440}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.base, paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <BackButton />
          <Text style={styles.title}>Help & Support</Text>
        </View>

        {/* ask BETina first */}
        <Pressable onPress={() => router.push('/(tabs)/chat')}>
          <GlowCard variant="accent" style={styles.askCard}>
            <BETinaAvatar size={52} />
            <View style={styles.askText}>
              <Text style={styles.askTitle}>Ask BETina first</Text>
              <Text style={styles.askHint}>She answers most questions instantly — 24/7.</Text>
            </View>
            <Text style={styles.askArrow}>→</Text>
          </GlowCard>
        </Pressable>

        {/* FAQ */}
        <View style={styles.section}>
          <SectionLabel>FREQUENT QUESTIONS</SectionLabel>
          <GlowCard>
            {FAQS.map((faq, i) => {
              const open = openIndex === i;
              return (
                <React.Fragment key={faq.q}>
                  <Pressable onPress={() => setOpenIndex(open ? -1 : i)} style={styles.faqItem}>
                    <View style={styles.faqHeader}>
                      <Text style={styles.faqQuestion}>{faq.q}</Text>
                      <Text style={[styles.faqCaret, open && styles.faqCaretOpen]}>
                        {open ? '▴' : '▾'}
                      </Text>
                    </View>
                    {open && <Text style={styles.faqAnswer}>{faq.a}</Text>}
                  </Pressable>
                  {i < FAQS.length - 1 && <View style={styles.divider} />}
                </React.Fragment>
              );
            })}
          </GlowCard>
        </View>

        {/* contact */}
        <View style={styles.section}>
          <SectionLabel>CONTACT US</SectionLabel>
          <View style={styles.contactRow}>
            <GlowCard style={styles.contactCard}>
              <Text style={styles.contactEmoji}>💬</Text>
              <Text style={styles.contactLabel}>Live chat</Text>
              <View style={styles.onlineRow}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineLabel}>Online now</Text>
              </View>
            </GlowCard>
            <GlowCard style={styles.contactCard}>
              <Text style={styles.contactEmoji}>✉️</Text>
              <Text style={styles.contactLabel}>Email</Text>
              <Text style={styles.contactHint}>Reply in ~4 h</Text>
            </GlowCard>
          </View>
        </View>

        <View style={styles.spacer} />
      </ScrollView>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    gap: 14,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingTop: Spacing.sm,
  },
  title: {
    color: Colors.white,
    fontSize: Typography.lg + 2,
    fontFamily: Fonts.bold,
  },
  askCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
  },
  askText: {
    flex: 1,
    gap: 2,
  },
  askTitle: {
    color: Colors.white,
    fontSize: Typography.base,
    fontFamily: Fonts.bold,
  },
  askHint: {
    color: Colors.textSecondary,
    fontSize: Typography.xs + 1,
    fontFamily: Fonts.medium,
    lineHeight: 17,
  },
  askArrow: {
    color: Colors.primary,
    fontSize: Typography.base + 1,
  },
  section: {
    gap: Spacing.sm,
  },
  faqItem: {
    gap: Spacing.sm,
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestion: {
    color: Colors.white,
    fontSize: Typography.sm + 1,
    fontFamily: Fonts.semibold,
  },
  faqCaret: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
  },
  faqCaretOpen: {
    color: Colors.primary,
  },
  faqAnswer: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    fontFamily: Fonts.medium,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: withAlpha(Colors.white, 0.06),
    marginHorizontal: 16,
  },
  contactRow: {
    flexDirection: 'row',
    gap: Spacing.sm + 2,
  },
  contactCard: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 16,
    paddingHorizontal: Spacing.sm + 2,
  },
  contactEmoji: { fontSize: 22 },
  contactLabel: {
    color: Colors.white,
    fontSize: Typography.sm,
    fontFamily: Fonts.bold,
  },
  onlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 0,
    backgroundColor: Colors.primary,
  },
  onlineLabel: {
    color: Colors.primary,
    fontSize: Typography.xs,
    fontFamily: Fonts.semibold,
  },
  contactHint: {
    color: Colors.textSecondary,
    fontSize: Typography.xs,
    fontFamily: Fonts.medium,
  },
  spacer: {
    flex: 1,
    minHeight: Spacing.base,
  },
  rgCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: 0,
    paddingVertical: 13,
    paddingHorizontal: 15,
  },
  rgEmoji: { fontSize: 17 },
  rgLabel: {
    flex: 1,
    color: Colors.white,
    fontSize: Typography.sm,
    fontFamily: Fonts.semibold,
  },
  rgHint: {
    color: Colors.textMuted,
    fontSize: Typography.xs + 1,
    fontFamily: Fonts.medium,
  },
});
