import { langForDialCode, useI18n } from '../../src/lib/i18n';
import React, { useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import BETinaAvatar from '../../src/components/BETinaAvatar';
import GlowButton from '../../src/components/GlowButton';
import ScreenBg from '../../src/components/ScreenBg';
import { Colors, Fonts, Spacing, Typography } from '../../src/theme';

const DIAL_CODES = [
  { flag: '🇦🇹', code: '+43', country: 'Austria' },
  { flag: '🇩🇪', code: '+49', country: 'Germany' },
  { flag: '🇨🇭', code: '+41', country: 'Switzerland' },
  { flag: '🇧🇷', code: '+55', country: 'Brazil' },
  { flag: '🇸🇻', code: '+503', country: 'El Salvador' },
  { flag: '🇳🇬', code: '+234', country: 'Nigeria' },
  { flag: '🇹🇿', code: '+255', country: 'Tanzania' },
  { flag: '🇨🇩', code: '+243', country: 'DR Congo' },
  { flag: '🇬🇳', code: '+224', country: 'Guinea' },
  { flag: '🇦🇴', code: '+244', country: 'Angola' },
  { flag: '🇲🇽', code: '+52', country: 'Mexico' },
  { flag: '🇨🇴', code: '+57', country: 'Colombia' },
  { flag: '🇦🇷', code: '+54', country: 'Argentina' },
  { flag: '🇵🇹', code: '+351', country: 'Portugal' },
  { flag: '🇪🇸', code: '+34', country: 'Spain' },
  { flag: '🇬🇧', code: '+44', country: 'United Kingdom' },
  { flag: '🇫🇷', code: '+33', country: 'France' },
  { flag: '🇺🇸', code: '+1', country: 'United States' },
  { flag: '🇰🇪', code: '+254', country: 'Kenya' },
  { flag: '🇬🇭', code: '+233', country: 'Ghana' },
  { flag: '🇸🇳', code: '+221', country: 'Senegal' },
  { flag: '🇸🇱', code: '+232', country: 'Sierra Leone' },
  // LatAm
  { flag: '🇻🇪', code: '+58', country: 'Venezuela' },
  { flag: '🇬🇹', code: '+502', country: 'Guatemala' },
  // CIS
  { flag: '🇷🇺', code: '+7', country: 'Russia' },
  { flag: '🇰🇿', code: '+7', country: 'Kazakhstan' },
  { flag: '🇺🇦', code: '+380', country: 'Ukraine' },
  { flag: '🇧🇾', code: '+375', country: 'Belarus' },
  { flag: '🇦🇲', code: '+374', country: 'Armenia' },
  { flag: '🇦🇿', code: '+994', country: 'Azerbaijan' },
  { flag: '🇬🇪', code: '+995', country: 'Georgia' },
  { flag: '🇰🇬', code: '+996', country: 'Kyrgyzstan' },
  { flag: '🇲🇩', code: '+373', country: 'Moldova' },
  { flag: '🇹🇯', code: '+992', country: 'Tajikistan' },
  { flag: '🇹🇲', code: '+993', country: 'Turkmenistan' },
  { flag: '🇺🇿', code: '+998', country: 'Uzbekistan' },
  // Asia
  { flag: '🇹🇭', code: '+66', country: 'Thailand' },
  { flag: '🇻🇳', code: '+84', country: 'Vietnam' },
  { flag: '🇵🇭', code: '+63', country: 'Philippines' },
  { flag: '🇮🇩', code: '+62', country: 'Indonesia' },
  { flag: '🇮🇳', code: '+91', country: 'India' },
  { flag: '🇲🇾', code: '+60', country: 'Malaysia' },
];

export default function Login() {
  const { lang, setLang, t } = useI18n();

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [dialEntry, setDialEntry] = useState(DIAL_CODES[0]);
  const [dialPickerVisible, setDialPickerVisible] = useState(false);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendCode = async () => {
    const fullPhone = `${dialEntry.code}${phone.replace(/\s/g, '')}`;
    if (phone.replace(/\D/g, '').length < 6) {
      setError(t.loginErrShort);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('https://intelligence.geniusbet.com/api/sms/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone }),
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok || !data.success) {
        setError(t.loginErrFailed);
        return;
      }
      router.push({ pathname: '/(auth)/otp', params: { phone: encodeURIComponent(fullPhone) } });
    } catch (e) {
      setLoading(false);
      setError(t.loginErrNetwork);
    }
  };

  return (
    <ScreenBg glowTop={0.18} glowSize={420}>
      {/* Dial code picker */}
      <Modal visible={dialPickerVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
            <Text style={styles.modalTitle}>{t.loginSelectDial}</Text>
            <FlatList
              data={DIAL_CODES}
              keyExtractor={(d) => d.code + d.country}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.dialRow, item.code === dialEntry.code && item.country === dialEntry.country && styles.dialRowActive]}
                  onPress={() => {
                    setDialEntry(item);
                    setDialPickerVisible(false);
                    const detected = langForDialCode(item.code);
                    if (detected) setLang(detected);
                  }}
                >
                  <Text style={styles.dialFlag}>{item.flag}</Text>
                  <Text style={styles.dialCountry}>{item.country}</Text>
                  <Text style={styles.dialCode}>{item.code}</Text>
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
        <View
          style={[
            styles.content,
            { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing['2xl'] },
          ]}
        >
          <Animated.View entering={FadeInDown.duration(700)} style={styles.header}>
            <BETinaAvatar size={88} />
            <View style={styles.headerText}>
              <Text style={styles.title}>{t.welcomeTitle}</Text>
              <Text style={styles.subtitle}>
                {t.enterPhone}.{'\n'}{t.welcomeSubtitle}
              </Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(150).duration(700)} style={styles.field}>
            <Text style={styles.fieldLabel}>{t.phoneLabel}</Text>
            <View style={styles.phoneRow}>
              <Pressable style={styles.dialCode} onPress={() => setDialPickerVisible(true)}>
                <Text style={styles.dialFlag}>{dialEntry.flag}</Text>
                <Text style={styles.dialText}>{dialEntry.code}</Text>
                <Text style={styles.dialCaret}>▾</Text>
              </Pressable>
              <View style={styles.inputWrap}>
                <TextInput
                  value={phone}
                  onChangeText={(v) => { setPhone(v); setError(null); }}
                  placeholder="664 123 45"
                  placeholderTextColor="#55556A"
                  keyboardType="phone-pad"
                  style={styles.input}
                  autoFocus
                />
              </View>
            </View>
            {error && <Text style={styles.error}>{error}</Text>}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(250).duration(700)} style={styles.ctaBlock}>
            <GlowButton label={t.continueBtn} onPress={sendCode} loading={loading} />
            <Text style={styles.terms}>
              {t.termsAgree} <Text style={styles.termsLink}>{t.termsLink}</Text> &{' '}
              <Text style={styles.termsLink}>{t.privacyLink}</Text>
            </Text>
          </Animated.View>

          <View style={styles.flex} />
        </View>
      </KeyboardAvoidingView>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flex: 1, paddingHorizontal: Spacing.xl },
  header: { alignItems: 'center', gap: Spacing.base, paddingTop: 28, paddingBottom: 36 },
  headerText: { alignItems: 'center', gap: 6 },
  title: { color: '#FFFFFF', fontSize: 26, fontFamily: Fonts.bold },
  subtitle: {
    color: Colors.textSecondary, fontSize: Typography.sm + 1,
    fontFamily: Fonts.medium, textAlign: 'center', lineHeight: 21,
  },
  field: { gap: Spacing.sm + 2 },
  fieldLabel: {
    color: Colors.textSecondary, fontSize: Typography.xs + 1,
    fontFamily: Fonts.semibold, letterSpacing: 1.2, textTransform: 'uppercase',
  },
  phoneRow: { flexDirection: 'row', gap: Spacing.sm + 2 },
  dialCode: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.glass, borderWidth: 1, borderColor: Colors.glassBorder,
    borderRadius: 20, paddingHorizontal: 14,
  },
  dialFlag: { fontSize: 18 },
  dialText: { color: '#FFFFFF', fontSize: Typography.md - 1, fontFamily: Fonts.semibold },
  dialCaret: { color: '#55556A', fontSize: 11 },
  inputWrap: {
    flex: 1, backgroundColor: Colors.glass, borderWidth: 1,
    borderColor: 'rgba(184,233,38,0.45)', borderRadius: 20, paddingHorizontal: 18,
  },
  input: {
    color: '#FFFFFF', fontSize: Typography.md - 1,
    fontFamily: Fonts.semibold, paddingVertical: 16,
  },
  error: { color: Colors.danger, fontSize: Typography.sm, fontFamily: Fonts.medium, lineHeight: 19 },
  ctaBlock: { gap: 18, marginTop: 28 },
  terms: {
    color: '#55556A', fontSize: Typography.xs + 1,
    fontFamily: Fonts.medium, textAlign: 'center', lineHeight: 19,
  },
  termsLink: { color: Colors.textSecondary, textDecorationLine: 'underline' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#16162A', borderTopLeftRadius: 28,
    borderTopRightRadius: 28, paddingTop: 20, maxHeight: '80%',
  },
  modalTitle: {
    color: '#FFFFFF', fontSize: Typography.base, fontFamily: Fonts.bold,
    textAlign: 'center', paddingBottom: 16,
  },
  dialRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: Spacing.md, paddingVertical: 14, paddingHorizontal: 24,
  },
  dialRowActive: { backgroundColor: 'rgba(184,233,38,0.08)' },
  dialCountry: { flex: 1, color: '#FFFFFF', fontSize: Typography.base - 1, fontFamily: Fonts.medium },
});
