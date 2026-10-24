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
import { Headline } from '../../src/components/Urban';
import { langForCountry, useI18n } from '../../src/lib/i18n';
import { supabase } from '../../src/lib/supabase';
import { Colors, Fonts } from '../../src/theme';

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
  { flag: '🇷🇴', name: 'Romania', code: 'RO' },
  { flag: '🇷🇸', name: 'Serbia', code: 'RS' },
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
    <ScreenBg>
      {/* Country picker modal */}
      <Modal visible={pickerVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
            <Text style={styles.modalTitle}>{t.registerSelectCountry.toUpperCase()}</Text>
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
                  <Text style={styles.modalCountryName}>{item.name.toUpperCase()}</Text>
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
            { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 },
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
            <Headline text={t.registerHeadline} size={60} accent="last" />
            <Text style={styles.subtitle}>{t.registerSubtitle}</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(120).duration(600)} style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{t.registerCountry}</Text>
              <Pressable style={styles.selectRow} onPress={() => setPickerVisible(true)}>
                <View style={styles.selectLeft}>
                  <Text style={styles.flag}>{country.flag}</Text>
                  <Text style={styles.selectValue}>{country.name.toUpperCase()}</Text>
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
                  placeholderTextColor={Colors.textMuted}
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
                    placeholder="DD" placeholderTextColor={Colors.textMuted}
                    keyboardType="number-pad" maxLength={2} style={styles.birthdayInput} />
                </View>
                <View style={[styles.birthdayBox, { flex: 1 }]}>
                  <TextInput value={month}
                    onChangeText={(v) => { setMonth(v.replace(/\D/g,'').slice(0,2)); setBirthdayError(null); }}
                    placeholder="MM" placeholderTextColor={Colors.textMuted}
                    keyboardType="number-pad" maxLength={2} style={styles.birthdayInput} />
                </View>
                <View style={[styles.birthdayBox, { flex: 1.4 }]}>
                  <TextInput value={year}
                    onChangeText={(v) => { setYear(v.replace(/\D/g,'').slice(0,4)); setBirthdayError(null); }}
                    placeholder="YYYY" placeholderTextColor={Colors.textMuted}
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
  content: { flexGrow: 1, paddingHorizontal: 16 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20 },
  progress: { flexDirection: 'row', gap: 4 },
  progressSeg: { width: 34, height: 6, backgroundColor: Colors.line },
  progressActive: { backgroundColor: Colors.primary },
  headerBlock: { gap: 10, paddingBottom: 26 },
  subtitle: { color: Colors.textSecondary, fontSize: 15, fontFamily: Fonts.medium, lineHeight: 21 },
  form: { gap: 18 },
  field: { gap: 8, marginTop: 18 },
  fieldLabel: { color: Colors.textMuted, fontSize: 10, fontFamily: Fonts.mono, letterSpacing: 0.9, textTransform: 'uppercase' },
  selectRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, paddingVertical: 14, paddingHorizontal: 14,
  },
  selectLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  flag: { fontSize: 20 },
  selectValue: { color: Colors.white, fontSize: 18, fontFamily: Fonts.label, letterSpacing: 0.3 },
  caret: { color: Colors.primary, fontSize: 12 },
  inputWrap: { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.primary, paddingHorizontal: 14 },
  input: { color: Colors.white, fontSize: 20, fontFamily: Fonts.label, paddingVertical: 14 },
  spacer: { flex: 1, minHeight: 24 },
  hintRow: { paddingBottom: 18 },
  hintText: { color: Colors.white, fontSize: 15, fontFamily: Fonts.medium, lineHeight: 21 },
  hintAccent: { color: Colors.primary, fontFamily: Fonts.label },
  birthdayRow: { flexDirection: 'row', gap: 8 },
  birthdayBox: { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border },
  birthdayInput: { color: Colors.white, fontSize: 26, fontFamily: Fonts.display, paddingVertical: 10, textAlign: 'center' },
  ageHint: { color: Colors.textMuted, fontSize: 10, fontFamily: Fonts.mono, letterSpacing: 0.8, textTransform: 'uppercase' },
  birthdayErr: { color: Colors.danger, fontSize: 13, fontFamily: Fonts.medium },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: Colors.black, borderTopWidth: 3, borderTopColor: Colors.primary, paddingTop: 18, maxHeight: '75%' },
  modalTitle: { color: Colors.white, fontSize: 24, fontFamily: Fonts.display, paddingHorizontal: 20, paddingBottom: 12 },
  modalItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: Colors.line,
  },
  modalItemActive: { backgroundColor: Colors.card },
  modalFlag: { fontSize: 22 },
  modalCountryName: { flex: 1, color: Colors.white, fontSize: 16, fontFamily: Fonts.label, letterSpacing: 0.3 },
  modalCheck: { color: Colors.primary, fontSize: 16, fontFamily: Fonts.label },
});
