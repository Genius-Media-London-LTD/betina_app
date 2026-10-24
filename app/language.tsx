import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import BackButton from '../src/components/BackButton';
import BETinaAvatar from '../src/components/BETinaAvatar';
import GlowCard from '../src/components/GlowCard';
import ScreenBg from '../src/components/ScreenBg';
import { languages } from '../src/lib/demo';
import { supabase } from '../src/lib/supabase';
import { Colors, Fonts, Spacing, Typography, withAlpha } from '../src/theme';

export default function Language() {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState('en');

  const choose = async (code: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(code);
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      await supabase.from('profiles').update({ language: code }).eq('id', data.user.id);
    }
  };

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
          <View style={styles.topText}>
            <Text style={styles.title}>Language</Text>
            <Text style={styles.subtitle}>BETina speaks your language.</Text>
          </View>
        </View>

        <GlowCard>
          {languages.map((lang, i) => (
            <React.Fragment key={lang.code}>
              <Pressable onPress={() => choose(lang.code)} style={styles.row}>
                <Text style={styles.flag}>{lang.flag}</Text>
                <View style={styles.rowText}>
                  <Text style={[styles.langName, selected === lang.code && styles.langNameActive]}>
                    {lang.name}
                  </Text>
                  <Text style={styles.langNative}>{lang.native}</Text>
                </View>
                {selected === lang.code && (
                  <View style={styles.check}>
                    <Text style={styles.checkLabel}>✓</Text>
                  </View>
                )}
              </Pressable>
              {i < languages.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </GlowCard>

        <View style={styles.spacer} />

        <View style={styles.note}>
          <BETinaAvatar size={32} />
          <Text style={styles.noteText}>Chat and notifications switch instantly — no restart needed.</Text>
        </View>
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
  topText: { gap: 1 },
  title: {
    color: Colors.white,
    fontSize: Typography.lg + 2,
    fontFamily: Fonts.bold,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: Typography.xs + 1,
    fontFamily: Fonts.medium,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  flag: { fontSize: 22 },
  rowText: {
    flex: 1,
    gap: 1,
  },
  langName: {
    color: Colors.white,
    fontSize: Typography.base,
    fontFamily: Fonts.semibold,
  },
  langNameActive: {
    fontFamily: Fonts.bold,
  },
  langNative: {
    color: Colors.textMuted,
    fontSize: Typography.xs + 1,
    fontFamily: Fonts.medium,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 0,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkLabel: {
    color: Colors.background,
    fontSize: Typography.xs + 1,
    fontFamily: Fonts.bold,
  },
  divider: {
    height: 1,
    backgroundColor: withAlpha(Colors.white, 0.06),
    marginHorizontal: 16,
  },
  spacer: {
    flex: 1,
    minHeight: Spacing.base,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm + 2,
    backgroundColor: withAlpha(Colors.accent, 0.18),
    borderWidth: 1,
    borderColor: withAlpha(Colors.accent, 0.4),
    borderRadius: 0,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  noteText: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: Typography.xs + 1,
    fontFamily: Fonts.medium,
    lineHeight: 18,
  },
});
