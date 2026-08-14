import React, { useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import BackButton from '../../src/components/BackButton';
import ChatBubble from '../../src/components/ChatBubble';
import GlowButton from '../../src/components/GlowButton';
import ScreenBg from '../../src/components/ScreenBg';
import { langForCountry, useI18n } from '../../src/lib/i18n';
import { supabase } from '../../src/lib/supabase';
import { Colors, Fonts, Spacing, Typography } from '../../src/theme';

const COUNTRIES = [
  { flag: '🇦🇹', name: 'Austria', code: 'AT' },
  { flag: '🇩🇪', name: 'Germany', code: 'DE' },
  { flag: '🇨🇭', name: 'Switzerland', code: 'CH' },
  { flag: '🇧🇷', name: 'Brazil', code: 'BR' },
  { flag: '🇸🇻', name: 'El Salvador', code: 'SV' },
  { flag: '🇳🇬', name: 'Nigeria', code: 'NG' },
  { flag: '🇹🇿', name: 'Tanzania', code: 'TZ' },
  { flag: '🇨🇩', name: 'DR Congo', code: 'CD' },
  { flag: '🇬🇳', name: 'Guinea', code: 'GN' },
  { flag: '🇦🇴', name: 'Angola', code: 'AO' },
  { flag: '🇲🇽', name: 'Mexico', code: 'MX' },
  { flag: '🇨🇴', name: 'Colombia', code: 'CO' },
  { flag: '🇦🇷', name: 'Argentina', code: 'AR' },
  { flag: '🇵🇹', name: 'Portugal', code: 'PT' },
  { flag: '🇪🇸', name: 'Spain', code: 'ES' },
  { flag: '🇬🇧', name: 'United Kingdom', code: 'GB' },
  { flag: '🇫🇷', name: 'France', code: 'FR' },
  { flag: '🇮🇹', name: 'Italy', code: 'IT' },
  { flag: '🇺🇸', name: 'United States', code: 'US' },
  { flag: '🇰🇪', name: 'Kenya', code: 'KE' },
  { flag: '🇬🇭', name: 'Ghana', code: 'GH' },
  { flag: '🇸🇳', name: 'Senegal', code: 'SN' },
  { flag: '🇸🇱', name: 'Sierra Leone', code: 'SL' },
  { flag: '🇻🇪', name: 'Venezuela', code: 'VE' },
  { flag: '🇬🇹', name: 'Guatemala', code: 'GT' },
  { flag: '🇷🇺', name: 'Russia', code: 'RU' },
  { flag: '🇰🇿', name: 'Kazakhstan', code: 'KZ' },
  { flag: '🇺🇦', name: 'Ukraine', code: 'UA' },
  { flag: '🇧🇾', name: 'Belarus', code: 'BY' },
  { flag: '🇦🇲', name: 'Armenia', code: 'AM' },
  { flag: '🇦🇿', name: 'Azerbaijan', code: 'AZ' },
  { flag: '🇬🇪', name: 'Georgia', code: 'GE' },
  { flag: '🇰🇬', name: 'Kyrgyzstan', code: 'KG' },
  { flag: '🇲🇩', name: 'Moldova', code: 'MD' },
  { flag: '🇹🇯', name: 'Tajikistan', code: 'TJ' },
  { flag: '🇹🇲', name: 'Turkmenistan', code: 'TM' },
  { flag: '🇺🇿', name: 'Uzbekistan', code: 'UZ' },
  { flag: '🇹🇭', name: 'Thailand', code: 'TH' },
  { flag: '🇻🇳', name: 'Vietnam', code: 'VN' },
  { flag: '🇵🇭', name: 'Philippines', code: 'PH' },
  { flag: '🇮🇩', name: 'Indonesia', code: 'ID' },
  { flag: '🇮🇳', name: 'India', code: 'IN' },
  { flag: '🇲🇾', name: 'Malaysia', code: 'MY' },
  { flag: '🌍', name: 'Other', code: 'XX' },
];

export default function Register() {
  const { lang, setLang, t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [birthdayError, setBirthdayError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const continueSetup = async () => {
    if (!name.trim()) return;
    setBirthdayError(null);
    const d = parseInt(day), m = parseInt(month), y = parseInt(year);
    if (!day || !month || !year || isNaN(d) || isNaN(m) || isNaN(y) || y < 1900) {
      setBirthdayError(t.registerErrBirthday);
      return;
    }
    if (new Date().getFullYear() - y < 18) {
      setBirthdayError(t.registerErr18);
      return;
    }
    const bday = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    setLoading(true);
    // Use getSession() (in-memory, reliable) rather than getUser() — the latter
    // makes a network call that can transiently return null on device, which
    // previously caused this profile write to be silently skipped.
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { error } = await supabase.from('profiles').upsert({
        id: session.user.id,
        name: name.trim(),
        country: country.name,
        language: lang,
        birthday: bday,
        vip_tier: 'INITIATE',
        xp_points: 100,
        streak_days: 0,
      });
      if (error) console.warn('register: profile save failed:', error.message);
    }
    setLoading(false);
    router.push({ pathname: '/(auth)/interests', params: { name: name.trim() } });
  };

  return (
    <ScreenBg glowTop={0.14} glowSize={420}>
      {/* Country picker modal */}
      <Modal visible={pickerVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
            <Text style={styles.modalTitle}>{t.registerSelectCountry}</Text>
            <FlatList
              data={COUNTRIES}
              keyExtractor={(c) => c.code}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.modalItem, item.code === country.code && styles.modalItemActive]}
                  onPress={() => {
                    setCountry(item);
                    setPickerVisible(false);
                    const detected = langForCountry(item.code);
                    if (detected) setLang(detected);
                  }}
                >
                  <Text style={styles.modalFlag}>{item.flag}</Text>
                  <Text style={styles.modalCountryName}>{item.name}</Text>
                  {item.code === country.code && <Text style={styles.modalCheck}>✓</Text>}
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + Spacing.base, paddingBottom: insets.bottom + Spacing['2xl'] },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.topBar}>
            <BackButton />
            <View style={styles.progress}>
              <View style={[styles.progressSeg, styles.progressActive]} />
              <View style={styles.progressSeg} />
            </View>
          </View>

          <Animated.View entering={FadeInDown.duration(600)} style={styles.headerBlock}>
            <Text style={styles.title}>{t.registerTitle}</Text>
            <Text style={styles.subtitle}>{t.registerSubtitle}</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(120).duration(600)} style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{t.registerCountry}</Text>
              <Pressable style={styles.selectRow} onPress={() => setPickerVisible(true)}>
                <View style={styles.selectLeft}>
                  <Text style={styles.flag}>{country.flag}</Text>
                  <Text style={styles.selectValue}>{country.name}</Text>
                </View>
                <Text style={styles.caret}>▾</Text>
              </Pressable>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{t.registerName}</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Your name"
                  placeholderTextColor="#55556A"
                  style={styles.input}
                  autoFocus
                />
              </View>
            </View>
          </Animated.View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{t.registerBirthday}</Text>
              <View style={styles.birthdayRow}>
                <View style={[styles.birthdayBox, { flex: 1 }]}>
                  <TextInput value={day}
                    onChangeText={(v) => { setDay(v.replace(/\D/g,'').slice(0,2)); setBirthdayError(null); }}
                    placeholder="DD" placeholderTextColor="#55556A"
                    keyboardType="number-pad" maxLength={2} style={styles.birthdayInput} />
                </View>
                <View style={[styles.birthdayBox, { flex: 1 }]}>
                  <TextInput value={month}
                    onChangeText={(v) => { setMonth(v.replace(/\D/g,'').slice(0,2)); setBirthdayError(null); }}
                    placeholder="MM" placeholderTextColor="#55556A"
                    keyboardType="number-pad" maxLength={2} style={styles.birthdayInput} />
                </View>
                <View style={[styles.birthdayBox, { flex: 1.4 }]}>
                  <TextInput value={year}
                    onChangeText={(v) => { setYear(v.replace(/\D/g,'').slice(0,4)); setBirthdayError(null); }}
                    placeholder="YYYY" placeholderTextColor="#55556A"
                    keyboardType="number-pad" maxLength={4} style={styles.birthdayInput} />
                </View>
              </View>
              {birthdayError
                ? <Text style={styles.birthdayErr}>{birthdayError}</Text>
                : <Text style={styles.ageHint}>You must be 18+ to use BETina.</Text>}
            </View>

          <View style={styles.spacer} />

          {name.trim().length > 0 && (
            <Animated.View entering={FadeInDown.duration(400)} style={styles.hintRow}>
              <ChatBubble role="assistant">
                <Text style={styles.hintText}>
                  {t.registerHint.replace('{name}', name.trim())}{' '}
                  <Text style={styles.hintAccent}>INITIATE</Text>.
                </Text>
              </ChatBubble>
            </Animated.View>
          )}

          <GlowButton
            label={t.continueBtn}
            onPress={continueSetup}
            disabled={!name.trim() || !day || !month || !year}
            loading={loading}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: Spacing.xl },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.lg,
  },
  progress: { flexDirection: 'row', gap: 6 },
  progressSeg: {
    width: 22, height: 4, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  progressActive: { backgroundColor: Colors.primary },
  headerBlock: { gap: Spacing.sm, paddingBottom: 30 },
  title: { color: '#FFFFFF', fontSize: 26, fontFamily: Fonts.bold },
  subtitle: {
    color: Colors.textSecondary, fontSize: Typography.sm + 1,
    fontFamily: Fonts.medium, lineHeight: 21,
  },
  form: { gap: Spacing.lg },
  field: { gap: Spacing.sm + 2 },
  fieldLabel: {
    color: Colors.textSecondary, fontSize: Typography.xs + 1,
    fontFamily: Fonts.semibold, letterSpacing: 1.2, textTransform: 'uppercase',
  },
  selectRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.glass, borderWidth: 1, borderColor: Colors.glassBorder,
    borderRadius: 20, paddingVertical: 16, paddingHorizontal: 18,
  },
  selectLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm + 2 },
  flag: { fontSize: 20 },
  selectValue: { color: '#FFFFFF', fontSize: Typography.md - 1, fontFamily: Fonts.semibold },
  caret: { color: '#55556A', fontSize: 12 },
  inputWrap: {
    backgroundColor: Colors.glass, borderWidth: 1,
    borderColor: 'rgba(184,233,38,0.45)', borderRadius: 20, paddingHorizontal: 18,
  },
  input: {
    color: '#FFFFFF', fontSize: Typography.md - 1,
    fontFamily: Fonts.semibold, paddingVertical: 16,
  },
  spacer: { flex: 1, minHeight: Spacing.xl },
  hintRow: { paddingBottom: 18 },
  hintText: {
    color: '#E8E8F0', fontSize: Typography.sm,
    fontFamily: Fonts.medium, lineHeight: 20,
  },
  hintAccent: { color: Colors.primary, fontFamily: Fonts.semibold },
  birthdayRow: { flexDirection: 'row', gap: Spacing.sm + 2 },
  birthdayBox: { backgroundColor: Colors.glass, borderWidth: 1, borderColor: Colors.glassBorder, borderRadius: 20 },
  birthdayInput: { color: '#FFFFFF', fontSize: Typography.md - 1, fontFamily: Fonts.semibold, paddingVertical: 16, textAlign: 'center' },
  ageHint: { color: '#55556A', fontSize: Typography.xs + 1, fontFamily: Fonts.medium },
  birthdayErr: { color: Colors.danger, fontSize: Typography.xs + 1, fontFamily: Fonts.medium },
  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#16162A', borderTopLeftRadius: 28,
    borderTopRightRadius: 28, paddingTop: 20, maxHeight: '75%',
  },
  modalTitle: {
    color: '#FFFFFF', fontSize: Typography.base,
    fontFamily: Fonts.bold, textAlign: 'center', paddingBottom: 16,
  },
  modalItem: {
    flexDirection: 'row', alignItems: 'center',
    gap: Spacing.md, paddingVertical: 14, paddingHorizontal: 24,
  },
  modalItemActive: { backgroundColor: 'rgba(184,233,38,0.08)' },
  modalFlag: { fontSize: 22 },
  modalCountryName: {
    flex: 1, color: '#FFFFFF',
    fontSize: Typography.base - 1, fontFamily: Fonts.medium,
  },
  modalCheck: { color: Colors.primary, fontSize: Typography.base, fontFamily: Fonts.bold },
});
