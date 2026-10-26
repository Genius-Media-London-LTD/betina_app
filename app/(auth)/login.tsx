import { langForDialCode, useI18n } from '../../src/lib/i18n';
import React, { useState } from 'react';
import {
  FlatList,
  Image,
  Keyboard,
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
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import DismissKeyboard from '../../src/components/DismissKeyboard';
import GlowButton from '../../src/components/GlowButton';
import ScreenBg from '../../src/components/ScreenBg';
import { Headline, Meta, Sticker } from '../../src/components/Urban';
import { Colors, Fonts } from '../../src/theme';

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
  { flag: '🇷🇴', code: '+40', country: 'Romania' },
  { flag: '🇷🇸', code: '+381', country: 'Serbia' },
  { flag: '🇭🇷', code: '+385', country: 'Croatia' },
  { flag: '🇧🇦', code: '+387', country: 'Bosnia and Herzegovina' },
  { flag: '🇹🇷', code: '+90', country: 'Turkey' },
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
    <ScreenBg>
      {/* Dial code picker */}
      <Modal visible={dialPickerVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>{t.loginSelectDial.toUpperCase()}</Text>
              <Pressable onPress={() => setDialPickerVisible(false)} hitSlop={10}>
                <Text style={styles.modalClose}>×</Text>
              </Pressable>
            </View>
            <FlatList
              data={DIAL_CODES}
              keyExtractor={(d) => d.code + d.country}
              renderItem={({ item }) => {
                const active = item.code === dialEntry.code && item.country === dialEntry.country;
                return (
                  <Pressable
                    style={[styles.dialRow, active && styles.dialRowActive]}
                    onPress={() => {
                      setDialEntry(item);
                      setDialPickerVisible(false);
                      const detected = langForDialCode(item.code);
                      if (detected) setLang(detected);
                    }}
                  >
                    <Text style={styles.dialFlag}>{item.flag}</Text>
                    <Text style={[styles.dialCountry, active && { color: Colors.black }]}>{item.country.toUpperCase()}</Text>
                    <Text style={[styles.dialCodeText, active && { color: Colors.black }]}>{item.code}</Text>
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <DismissKeyboard>
          <View style={styles.flex}>
            {/* Photo header */}
            <Animated.View entering={FadeIn.duration(700)} style={styles.photo}>
              <Image source={require('../../assets/urban/betina-login.jpg')} style={styles.photoImage} resizeMode="cover" />
              <LinearGradient colors={['transparent', Colors.black]} locations={[0.45, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />
              <View style={[styles.photoTop, { top: insets.top + 10 }]}>
                <Image source={require('../../assets/urban/logo-wordmark.png')} style={styles.wordmark} resizeMode="contain" />
              </View>
              <Sticker text={t.loginSticker} rotate={4} style={styles.sticker} />
            </Animated.View>

            <View style={[styles.content, { paddingBottom: insets.bottom + 12 }]}>
              <Animated.View entering={FadeInDown.delay(150).duration(600)}>
                <Headline text={t.loginHeadline} size={60} accent="last" />
                <Text style={styles.subtitle}>{t.enterPhone}. {t.welcomeSubtitle}</Text>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(250).duration(600)} style={styles.field}>
                <Meta>{t.phoneLabel}</Meta>
                <View style={styles.phoneRow}>
                  <Pressable style={styles.dialCode} onPress={() => setDialPickerVisible(true)}>
                    <Text style={styles.dialFlag}>{dialEntry.flag}</Text>
                    <Text style={styles.dialText}>{dialEntry.code}</Text>
                    <Text style={styles.dialCaret}>▾</Text>
                  </Pressable>
                  <TextInput
                    value={phone}
                    onChangeText={(v) => { setPhone(v); setError(null); }}
                    placeholder="664 123 45"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="phone-pad"
                    style={styles.input}
                    returnKeyType="done"
                    onSubmitEditing={() => Keyboard.dismiss()}
                  />
                </View>
                {error && <Text style={styles.error}>{error}</Text>}
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(350).duration(600)} style={styles.ctaBlock}>
                <GlowButton label={t.loginSendCode} onPress={sendCode} loading={loading} />
                <Text style={styles.terms}>
                  {t.termsAgree}{' '}
                  <Text style={styles.termsLink} onPress={() => router.push({ pathname: '/legal/[doc]', params: { doc: 'terms' } })} suppressHighlighting>
                    {t.termsLink}
                  </Text>
                  {' & '}
                  <Text style={styles.termsLink} onPress={() => router.push({ pathname: '/legal/[doc]', params: { doc: 'privacy' } })} suppressHighlighting>
                    {t.privacyLink}
                  </Text>
                </Text>
              </Animated.View>

              <View style={styles.flex} />

              {/* Guest access — Apple 5.1.1(v): non-account content (news/articles)
                  must be reachable without registering. Lands on the News tab. */}
              <View style={styles.footer}>
                <Meta>18+</Meta>
                <Pressable onPress={() => router.replace('/(tabs)/live')} hitSlop={8}>
                  <Meta color={Colors.primary}>{`${t.loginGuest} →`}</Meta>
                </Pressable>
              </View>
            </View>
          </View>
        </DismissKeyboard>
      </KeyboardAvoidingView>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  photo: { height: '42%', minHeight: 260, overflow: 'hidden', backgroundColor: Colors.surface },
  photoImage: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  photoTop: { position: 'absolute', left: 16, right: 16 },
  wordmark: { width: 120, height: 22 },
  sticker: { position: 'absolute', right: 16, bottom: 22 },
  content: { flex: 1, paddingHorizontal: 16, gap: 18, marginTop: -6 },
  subtitle: { color: Colors.textSecondary, fontSize: 15, lineHeight: 21, fontFamily: Fonts.medium, marginTop: 8 },
  field: { gap: 8 },
  phoneRow: { flexDirection: 'row', gap: 8 },
  dialCode: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  dialFlag: { fontSize: 18 },
  dialText: { color: Colors.white, fontSize: 17, fontFamily: Fonts.label },
  dialCaret: { color: Colors.primary, fontSize: 11 },
  input: {
    flex: 1, color: Colors.white, fontSize: 20, fontFamily: Fonts.label, letterSpacing: 1,
    paddingVertical: 14, paddingHorizontal: 14,
    borderWidth: 1.5, borderColor: Colors.primary, backgroundColor: Colors.surface,
  },
  error: { color: Colors.danger, fontSize: 14, fontFamily: Fonts.medium, lineHeight: 19 },
  ctaBlock: { gap: 14 },
  terms: { color: Colors.textMuted, fontSize: 12, fontFamily: Fonts.medium, lineHeight: 18 },
  termsLink: { color: Colors.textSecondary, textDecorationLine: 'underline' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: Colors.black, borderTopWidth: 3, borderTopColor: Colors.primary, maxHeight: '80%' },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  modalTitle: { color: Colors.white, fontSize: 24, fontFamily: Fonts.display },
  modalClose: { color: Colors.white, fontSize: 26, fontFamily: Fonts.label },
  dialRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: Colors.line,
  },
  dialRowActive: { backgroundColor: Colors.primary },
  dialCountry: { flex: 1, color: Colors.white, fontSize: 16, fontFamily: Fonts.label, letterSpacing: 0.3 },
  dialCodeText: { color: Colors.textSecondary, fontSize: 13, fontFamily: Fonts.monoBold },
});
