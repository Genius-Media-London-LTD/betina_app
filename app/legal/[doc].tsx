import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackButton from '../../src/components/BackButton';
import ScreenBg from '../../src/components/ScreenBg';
import { LEGAL_DOCS, LegalDocKey } from '../../src/lib/legal';
import { Colors, Fonts, Spacing, Typography } from '../../src/theme';

export default function LegalDocScreen() {
  const insets = useSafeAreaInsets();
  const { doc } = useLocalSearchParams<{ doc: string }>();
  const content = LEGAL_DOCS[doc as LegalDocKey] ?? LEGAL_DOCS.about;

  return (
    <ScreenBg glowTop={0.1} glowSize={420}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.base, paddingBottom: insets.bottom + Spacing['2xl'] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <BackButton />
          <Text style={styles.title}>{content.title}</Text>
        </View>

        {content.updated ? <Text style={styles.updated}>Last updated: {content.updated}</Text> : null}

        {content.sections.map((s, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.heading}>{s.heading}</Text>
            <Text style={styles.body}>{s.body}</Text>
          </View>
        ))}
      </ScrollView>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: Spacing.lg, gap: Spacing.base },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingTop: Spacing.sm },
  title: { color: Colors.white, fontSize: Typography.lg + 2, fontFamily: Fonts.bold, flex: 1 },
  updated: { color: Colors.textMuted, fontSize: Typography.xs + 1, fontFamily: Fonts.medium, marginTop: -6 },
  section: { gap: 6 },
  heading: { color: Colors.primary, fontSize: Typography.base, fontFamily: Fonts.bold },
  body: { color: Colors.textSecondary, fontSize: Typography.sm + 1, fontFamily: Fonts.medium, lineHeight: 22 },
});
