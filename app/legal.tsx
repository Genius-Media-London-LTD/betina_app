import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackButton from '../src/components/BackButton';
import GlowCard from '../src/components/GlowCard';
import ScreenBg from '../src/components/ScreenBg';
import { LEGAL_DOCS, LegalDocKey } from '../src/lib/legal';
import { Colors, Fonts, Spacing, Typography, withAlpha } from '../src/theme';

const DOCS: { key: LegalDocKey; emoji: string }[] = [
  { key: 'privacy', emoji: '🔒' },
  { key: 'terms', emoji: '📄' },
  { key: 'imprint', emoji: '🏛️' },
  { key: 'about', emoji: '⚡' },
];

export default function Legal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ScreenBg>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <BackButton />
          <Text style={styles.title}>Legal</Text>
        </View>

        <GlowCard>
          {DOCS.map((d, i) => (
            <React.Fragment key={d.key}>
              <Pressable
                onPress={() => router.push({ pathname: '/legal/[doc]', params: { doc: d.key } })}
                style={styles.row}
              >
                <Text style={styles.rowEmoji}>{d.emoji}</Text>
                <Text style={styles.rowLabel}>{LEGAL_DOCS[d.key].title}</Text>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
              {i < DOCS.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </GlowCard>

        <Pressable onPress={() => router.push('/responsible-gaming')}>
          <GlowCard style={styles.rgCard}>
            <Text style={styles.rowEmoji}>🛡️</Text>
            <Text style={styles.rowLabel}>Responsible gaming</Text>
            <Text style={styles.chevron}>›</Text>
          </GlowCard>
        </Pressable>
      </ScrollView>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: Spacing.lg, gap: 14 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingTop: Spacing.sm },
  title: { color: Colors.white, fontSize: 44, lineHeight: 46, fontFamily: Fonts.display, textTransform: 'uppercase', flexShrink: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: 14, paddingHorizontal: 16 },
  rowEmoji: { fontSize: 17 },
  rowLabel: { flex: 1, color: Colors.white, fontSize: Typography.sm + 1, fontFamily: Fonts.semibold },
  chevron: { color: Colors.textMuted, fontSize: Typography.sm + 1 },
  external: { color: Colors.textMuted, fontSize: Typography.xs + 1, fontFamily: Fonts.medium },
  divider: { height: 1, backgroundColor: withAlpha(Colors.white, 0.06), marginHorizontal: 16 },
  rgCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: 14, paddingHorizontal: 16 },
});
