import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackButton from '../src/components/BackButton';
import GlowCard from '../src/components/GlowCard';
import ScreenBg from '../src/components/ScreenBg';
import SectionLabel from '../src/components/SectionLabel';
import Toggle from '../src/components/Toggle';
import { Colors, Fonts, Spacing, Typography, withAlpha } from '../src/theme';

type PrefRow = {
  key: string;
  emoji: string;
  label: string;
  hint: string;
  defaultOn: boolean;
};

const SECTIONS: Array<{ title: string; rows: PrefRow[] }> = [
  {
    title: 'MATCHES',
    rows: [
      { key: 'kickoff', emoji: '⚽', label: 'Kickoff reminders', hint: '1 hour before your events', defaultOn: true },
      { key: 'goals', emoji: '🥅', label: 'Goals & key moments', hint: 'Live during Barcelona matches', defaultOn: true },
      { key: 'results', emoji: '🏁', label: 'Final results', hint: 'When followed events finish', defaultOn: false },
    ],
  },
  {
    title: 'BETINA',
    rows: [
      { key: 'messages', emoji: '💬', label: 'Messages from BETina', hint: 'Insights, lineups & match talk', defaultOn: true },
      { key: 'quiet', emoji: '🌙', label: 'Quiet hours', hint: '23:00 – 08:00', defaultOn: true },
    ],
  },
  {
    title: 'PROGRESS',
    rows: [
      { key: 'tier', emoji: '🏆', label: 'Tier & XP updates', hint: 'Tier-ups and milestones', defaultOn: false },
      { key: 'streak', emoji: '🔥', label: 'Streak reminders', hint: 'Before your daily streak expires', defaultOn: true },
    ],
  },
];

export default function NotificationPrefs() {
  const insets = useSafeAreaInsets();
  const [values, setValues] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(SECTIONS.flatMap((s) => s.rows.map((r) => [r.key, r.defaultOn]))),
  );

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
          <Text style={styles.title}>Notifications</Text>
        </View>

        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <SectionLabel>{section.title}</SectionLabel>
            <GlowCard>
              {section.rows.map((row, i) => (
                <React.Fragment key={row.key}>
                  <View style={styles.row}>
                    <Text style={styles.rowEmoji}>{row.emoji}</Text>
                    <View style={styles.rowText}>
                      <Text style={styles.rowLabel}>{row.label}</Text>
                      <Text style={styles.rowHint}>{row.hint}</Text>
                    </View>
                    <Toggle
                      value={values[row.key]}
                      onValueChange={(v) => setValues((prev) => ({ ...prev, [row.key]: v }))}
                    />
                  </View>
                  {i < section.rows.length - 1 && <View style={styles.divider} />}
                </React.Fragment>
              ))}
            </GlowCard>
          </View>
        ))}
      </ScrollView>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  content: {
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
  section: {
    gap: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowEmoji: { fontSize: 17 },
  rowText: {
    flex: 1,
    gap: 1,
  },
  rowLabel: {
    color: Colors.white,
    fontSize: Typography.sm + 1,
    fontFamily: Fonts.semibold,
  },
  rowHint: {
    color: Colors.textMuted,
    fontSize: Typography.xs + 1,
    fontFamily: Fonts.medium,
  },
  divider: {
    height: 1,
    backgroundColor: withAlpha(Colors.white, 0.06),
    marginHorizontal: 16,
  },
});
