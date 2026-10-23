// In-app Responsible Gaming page. Content is in English (standard for these
// pages, like Privacy/Terms). Linked from Settings → Support.

import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import BackButton from '../src/components/BackButton';
import BETinaAvatar from '../src/components/BETinaAvatar';
import GlowButton from '../src/components/GlowButton';
import GlowCard from '../src/components/GlowCard';
import ScreenBg from '../src/components/ScreenBg';
import SectionLabel from '../src/components/SectionLabel';
import { Colors, Fonts, Spacing, Typography, withAlpha } from '../src/theme';

const GENIUSBET_RG_URL = 'https://www.geniusbet.com/responsible-gaming';

const PRINCIPLES = [
  'Betting is entertainment — never a way to make money.',
  'Only ever stake what you can comfortably afford to lose.',
  'Never chase losses. If you’re behind, take a break instead.',
  'You must be 18 or older to play.',
];

const TOOLS = [
  { emoji: '💰', label: 'Deposit limits', hint: 'Cap how much you can add per day, week or month.' },
  { emoji: '📉', label: 'Loss & stake limits', hint: 'Set a ceiling so you always stay in control.' },
  { emoji: '⏱️', label: 'Session reminders', hint: 'Reality checks that keep you aware of time spent.' },
  { emoji: '⏸️', label: 'Take a break', hint: 'Pause your account for 24 hours up to 6 weeks.' },
  { emoji: '🚫', label: 'Self-exclusion', hint: 'Block access for a longer period when you need to.' },
];

const SIGNS = [
  'Betting more, or more often, than you planned.',
  'Trying to win back what you’ve lost.',
  'Betting to escape stress or a low mood.',
  'Losing track of time or money.',
  'Hiding your betting from people close to you.',
];

export default function ResponsibleGaming() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

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
          <Text style={styles.title}>Responsible Gaming</Text>
        </View>

        {/* BETina intro */}
        <GlowCard variant="accent" style={styles.introCard}>
          <BETinaAvatar size={52} />
          <View style={styles.introText}>
            <Text style={styles.introTitle}>Let’s keep it fun 💚</Text>
            <Text style={styles.introBody}>
              I want you to enjoy the game and stay in control. Betting should be entertainment —
              never a way to make money or chase losses.
            </Text>
          </View>
        </GlowCard>

        {/* Principles */}
        <View style={styles.section}>
          <SectionLabel>STAY IN CONTROL</SectionLabel>
          <GlowCard style={styles.listCard}>
            {PRINCIPLES.map((p, i) => (
              <View key={i} style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>{p}</Text>
              </View>
            ))}
          </GlowCard>
        </View>

        {/* Tools */}
        <View style={styles.section}>
          <SectionLabel>YOUR SAFER-PLAY TOOLS</SectionLabel>
          <GlowCard>
            {TOOLS.map((tool, i) => (
              <React.Fragment key={tool.label}>
                <View style={styles.toolRow}>
                  <Text style={styles.toolEmoji}>{tool.emoji}</Text>
                  <View style={styles.toolText}>
                    <Text style={styles.toolLabel}>{tool.label}</Text>
                    <Text style={styles.toolHint}>{tool.hint}</Text>
                  </View>
                </View>
                {i < TOOLS.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))}
          </GlowCard>
          <Text style={styles.toolsNote}>
            These tools are set on your GeniusBet account, where your betting happens.
          </Text>
          <GlowButton
            label="Manage my limits on GeniusBet"
            onPress={() => WebBrowser.openBrowserAsync(GENIUSBET_RG_URL)}
            style={styles.cta}
          />
        </View>

        {/* Signs */}
        <View style={styles.section}>
          <SectionLabel>SIGNS TO WATCH FOR</SectionLabel>
          <GlowCard style={styles.listCard}>
            {SIGNS.map((s, i) => (
              <View key={i} style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>{s}</Text>
              </View>
            ))}
            <Text style={styles.signsFooter}>
              If any of these feel familiar, it may be time to take a break.
            </Text>
          </GlowCard>
        </View>

        {/* Help */}
        <View style={styles.section}>
          <SectionLabel>NEED TO TALK?</SectionLabel>
          <Pressable onPress={() => router.push('/(tabs)/chat')}>
            <GlowCard style={styles.helpCard}>
              <Text style={styles.helpEmoji}>🤝</Text>
              <View style={styles.helpText}>
                <Text style={styles.helpTitle}>You’re not alone</Text>
                <Text style={styles.helpHint}>
                  Talk to BETina any time, or reach our support team through the app.
                </Text>
              </View>
              <Text style={styles.helpArrow}>→</Text>
            </GlowCard>
          </Pressable>
        </View>

        <Text style={styles.footer}>
          BETina is an entertainment app for adults (18+). No real-money betting happens here —
          bets take place only on the GeniusBet website.
        </Text>
      </ScrollView>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: Spacing.lg, gap: 16 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingTop: Spacing.sm },
  title: { color: Colors.white, fontSize: Typography.lg + 2, fontFamily: Fonts.bold },
  introCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  introText: { flex: 1, gap: 3 },
  introTitle: { color: Colors.white, fontSize: Typography.base, fontFamily: Fonts.bold },
  introBody: { color: Colors.textSecondary, fontSize: Typography.xs + 1, fontFamily: Fonts.medium, lineHeight: 18 },
  section: { gap: Spacing.sm },
  listCard: { paddingVertical: 14, paddingHorizontal: 16, gap: 10 },
  bulletRow: { flexDirection: 'row', gap: 8 },
  bulletDot: { color: Colors.primary, fontSize: Typography.sm + 1, lineHeight: 20 },
  bulletText: { flex: 1, color: Colors.textPrimary, fontSize: Typography.sm, fontFamily: Fonts.medium, lineHeight: 20 },
  toolRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: 13, paddingHorizontal: 16 },
  toolEmoji: { fontSize: 20 },
  toolText: { flex: 1, gap: 2 },
  toolLabel: { color: Colors.white, fontSize: Typography.sm + 1, fontFamily: Fonts.bold },
  toolHint: { color: Colors.textSecondary, fontSize: Typography.xs + 1, fontFamily: Fonts.medium, lineHeight: 17 },
  divider: { height: 1, backgroundColor: withAlpha(Colors.white, 0.06), marginHorizontal: 16 },
  toolsNote: { color: Colors.textMuted, fontSize: Typography.xs + 1, fontFamily: Fonts.medium, lineHeight: 17, paddingHorizontal: 4 },
  cta: { marginTop: 4 },
  signsFooter: { color: Colors.textSecondary, fontSize: Typography.sm, fontFamily: Fonts.semibold, lineHeight: 20, paddingTop: 4 },
  helpCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: 16 },
  helpEmoji: { fontSize: 22 },
  helpText: { flex: 1, gap: 2 },
  helpTitle: { color: Colors.white, fontSize: Typography.sm + 1, fontFamily: Fonts.bold },
  helpHint: { color: Colors.textSecondary, fontSize: Typography.xs + 1, fontFamily: Fonts.medium, lineHeight: 17 },
  helpArrow: { color: Colors.primary, fontSize: Typography.base },
  footer: { color: Colors.textMuted, fontSize: Typography.xs, fontFamily: Fonts.medium, lineHeight: 17, textAlign: 'center', paddingHorizontal: Spacing.sm, paddingTop: Spacing.sm },
});
