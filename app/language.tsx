import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import BackButton from '../src/components/BackButton';
import ScreenBg from '../src/components/ScreenBg';
import { Meta } from '../src/components/Urban';
import { LANGUAGES, LangCode, useI18n } from '../src/lib/i18n';
import { supabase } from '../src/lib/supabase';
import { Colors, Fonts } from '../src/theme';

/** App language — switches instantly and is saved on the profile (chat + pushes use it). */
export default function Language() {
  const insets = useSafeAreaInsets();
  const { lang, setLang, t } = useI18n();

  const choose = async (code: LangCode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await setLang(code);
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      await supabase.from('profiles').update({ language: code }).eq('id', data.user.id);
    }
  };

  return (
    <ScreenBg>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <BackButton />
          <Meta color={Colors.primary}>{`${LANGUAGES.length} ${t.settingsLanguage}`}</Meta>
        </View>
        <Text style={styles.title}>{t.settingsLanguage.toUpperCase()}<Text style={{ color: Colors.primary }}>.</Text></Text>

        <View>
          {LANGUAGES.map((l) => {
            const active = l.code === lang;
            return (
              <Pressable key={l.code} onPress={() => choose(l.code)} style={[styles.row, active && styles.rowActive]}>
                <Text style={styles.flag}>{l.flag}</Text>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[styles.name, active && styles.nameActive]}>{l.nativeName.toUpperCase()}</Text>
                  <Meta color={active ? Colors.black : Colors.textMuted}>{l.label}</Meta>
                </View>
                <Text style={[styles.check, active && { color: Colors.black }]}>{active ? '✓' : ''}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: 16, gap: 14 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: Colors.white, fontSize: 64, lineHeight: 66, fontFamily: Fonts.display, marginTop: 6 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.line,
  },
  rowActive: { backgroundColor: Colors.primary, borderBottomColor: Colors.primary },
  flag: { fontSize: 24 },
  name: { color: Colors.white, fontSize: 22, fontFamily: Fonts.display },
  nameActive: { color: Colors.black },
  check: { color: Colors.primary, fontSize: 20, fontFamily: Fonts.label },
});
