// Email login, step 1: the address. Supabase mails a 6-digit code; step 2 is the
// shared code screen (otp.tsx with an email param).
import React, { useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import BackButton from '../../src/components/BackButton';
import ChatBubble from '../../src/components/ChatBubble';
import DismissKeyboard from '../../src/components/DismissKeyboard';
import GlowButton from '../../src/components/GlowButton';
import ScreenBg from '../../src/components/ScreenBg';
import { Headline, Meta } from '../../src/components/Urban';
import { isEmail, sendEmailCode } from '../../src/lib/auth';
import { useI18n } from '../../src/lib/i18n';
import { Colors, Fonts } from '../../src/theme';

export default function EmailLogin() {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    Keyboard.dismiss();
    if (!isEmail(email)) {
      setError(t.emailErrInvalid);
      return;
    }
    setLoading(true);
    setError(null);
    const ok = await sendEmailCode(email);
    setLoading(false);
    if (!ok) {
      setError(t.loginErrFailed);
      return;
    }
    router.push({ pathname: '/(auth)/otp', params: { email: encodeURIComponent(email.trim().toLowerCase()) } });
  };

  return (
    <ScreenBg>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <DismissKeyboard>
          <View style={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]}>
            <View style={styles.topBar}>
              <BackButton />
            </View>

            <Animated.View entering={FadeInDown.duration(600)} style={styles.headerBlock}>
              <Headline text={t.emailHeadline} size={60} accent="last" />
              <Text style={styles.subtitle}>{t.emailSubtitle}</Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(120).duration(600)} style={styles.field}>
              <Meta>{t.emailLabel}</Meta>
              <TextInput
                value={email}
                onChangeText={(v) => { setEmail(v); setError(null); }}
                placeholder="name@mail.com"
                placeholderTextColor={Colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="send"
                onSubmitEditing={send}
                style={styles.input}
                autoFocus
              />
              {error && <Text style={styles.error}>{error}</Text>}
            </Animated.View>

            <GlowButton label={t.loginSendCode} onPress={send} loading={loading} style={styles.cta} />

            <View style={styles.flex} />

            <View style={styles.hintRow}>
              <ChatBubble role="assistant">{t.otpHint}</ChatBubble>
            </View>
          </View>
        </DismissKeyboard>
      </KeyboardAvoidingView>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 16 },
  topBar: { paddingBottom: 20 },
  headerBlock: { gap: 10, paddingBottom: 28 },
  subtitle: { color: Colors.textSecondary, fontSize: 15, fontFamily: Fonts.medium, lineHeight: 21 },
  field: { gap: 8 },
  input: {
    color: Colors.white, fontSize: 18, fontFamily: Fonts.label,
    paddingVertical: 14, paddingHorizontal: 14,
    borderWidth: 1.5, borderColor: Colors.primary, backgroundColor: Colors.surface,
  },
  error: { color: Colors.danger, fontSize: 14, fontFamily: Fonts.medium, lineHeight: 19 },
  cta: { marginTop: 20 },
  hintRow: { alignItems: 'flex-start' },
});
