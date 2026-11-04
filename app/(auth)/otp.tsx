import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import Animated, { FadeInDown } from 'react-native-reanimated';
import BackButton from '../../src/components/BackButton';
import DismissKeyboard from '../../src/components/DismissKeyboard';
import ChatBubble from '../../src/components/ChatBubble';
import GlowButton from '../../src/components/GlowButton';
import ScreenBg from '../../src/components/ScreenBg';
import { Headline, Meta } from '../../src/components/Urban';
import { routeAfterSignIn, sendEmailCode, verifyEmailCode } from '../../src/lib/auth';
import { useI18n } from '../../src/lib/i18n';
import { supabase } from '../../src/lib/supabase';
import { Colors, Fonts, displayType } from '../../src/theme';

const CODE_LENGTH = 6;

export default function Otp() {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // Either a phone number (GeniusBet OTP server) or an email (Supabase email code).
  const { phone: rawPhone, email: rawEmail } = useLocalSearchParams<{ phone?: string; email?: string }>();
  const phone = rawPhone ? decodeURIComponent(rawPhone).trim() : '';
  const email = rawEmail ? decodeURIComponent(rawEmail).trim() : '';
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(24);
  const [rememberDevice, setRememberDevice] = useState(true);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setInterval(() => setResendIn((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [resendIn]);

  const verify = async () => {
    if (code.length < CODE_LENGTH) return;
    setLoading(true);
    setError(null);
    if (email) {
      const ok = await verifyEmailCode(email, code);
      if (!ok) {
        setLoading(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setError(t.otpErrWrong);
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace(await routeAfterSignIn());
      return;
    }
    try {
      const res = await fetch('https://intelligence.geniusbet.com/api/sms/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone ?? '', otp: code }),
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok || data.error) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setError(t.otpErrWrong);
        return;
      }
      // Set session in Supabase client
      await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });

      // Save device token for 30-day auto-login (native only). SecureStore is
      // unavailable on web and throws — which previously aborted the whole
      // login with a "Network error". Guard by platform and swallow failures.
      if (rememberDevice && data.device_token && Platform.OS !== 'web') {
        try {
          await SecureStore.setItemAsync('betina_device_token', data.device_token);
          await SecureStore.setItemAsync('betina_device_phone', phone ?? '');
        } catch (e) {
          console.warn('device token save failed:', e);
        }
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Check if profile exists — new user goes to register, existing to home
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('id', data.user.id)
        .maybeSingle();
      if (profile?.name) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/register');
      }
    } catch (e) {
      setLoading(false);
      setError(`Network error — please try again.`);
    }
  };

  const resend = async () => {
    if (resendIn > 0) return;
    setResendIn(24);
    if (email) { await sendEmailCode(email); return; }
    await fetch('https://intelligence.geniusbet.com/api/sms/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phone ?? '' }),
    });
  };

  const digits = Array.from({ length: CODE_LENGTH }, (_, i) => code[i] ?? '');
  const activeIndex = Math.min(code.length, CODE_LENGTH - 1);

  return (
    <ScreenBg>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
       <DismissKeyboard>
        <View
          style={[
            styles.content,
            { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 },
          ]}
        >
          <View style={styles.topBar}>
            <BackButton />
          </View>

          <Animated.View entering={FadeInDown.duration(600)} style={styles.headerBlock}>
            <Headline text={t.otpHeadline} size={60} accent="last" />
            <Text style={styles.subtitle}>{t.otpSentTo.replace('{phone}', email || phone)}</Text>
          </Animated.View>

          {/* OTP boxes over a hidden input */}
          <Pressable onPress={() => inputRef.current?.focus()}>
            <Animated.View entering={FadeInDown.delay(120).duration(600)} style={styles.otpRow}>
              {digits.map((d, i) => (
                <View
                  key={i}
                  style={[styles.otpBox, i === activeIndex && code.length < CODE_LENGTH && styles.otpBoxActive]}
                >
                  {d ? (
                    <Text style={styles.otpDigit}>{d}</Text>
                  ) : (
                    i === code.length && <View style={styles.cursor} />
                  )}
                </View>
              ))}
            </Animated.View>
          </Pressable>
          <TextInput
            ref={inputRef}
            value={code}
            onChangeText={(t) => {
              setError(null);
              setCode(t.replace(/\D/g, '').slice(0, CODE_LENGTH));
            }}
            keyboardType="number-pad"
            maxLength={CODE_LENGTH}
            style={styles.hiddenInput}
            autoFocus
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.resendRow}>
            <Meta>{`${code.length} / ${CODE_LENGTH}`}</Meta>
            {resendIn > 0 ? (
              <Meta>{`${t.otpResendIn} 0:${String(resendIn).padStart(2, '0')}`}</Meta>
            ) : (
              <Pressable onPress={resend} hitSlop={8}>
                <Meta color={Colors.primary}>{`${t.otpResend} →`}</Meta>
              </Pressable>
            )}
          </View>

          {/* Remember device checkbox — phone only; email sessions persist on their own */}
          {!email && <Pressable
            onPress={() => setRememberDevice((v) => !v)}
            style={styles.rememberRow}
            hitSlop={8}
          >
            <View style={[styles.checkbox, rememberDevice && styles.checkboxActive]}>
              {rememberDevice && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.rememberLabel}>{t.otpRememberDevice}</Text>
          </Pressable>}

          <GlowButton
            label={t.otpVerify}
            onPress={verify}
            loading={loading}
            disabled={code.length < CODE_LENGTH}
            style={styles.cta}
          />

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
  otpRow: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  otpBox: {
    // Flexible width so all six boxes always fit the screen; capped on tablets.
    flex: 1, maxWidth: 62, aspectRatio: 0.8, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border,
  },
  otpBoxActive: { borderColor: Colors.primary },
  otpDigit: { ...displayType(40, 46), color: Colors.white },
  cursor: { width: 3, height: 30, backgroundColor: Colors.primary },
  hiddenInput: { position: 'absolute', opacity: 0, height: 1, width: 1 },
  error: { color: Colors.danger, fontSize: 14, fontFamily: Fonts.medium, textAlign: 'center', paddingTop: 14 },
  resendRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12 },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 24 },
  checkbox: {
    width: 22, height: 22, borderWidth: 1.5, borderColor: Colors.borderStrong,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxActive: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  checkmark: { color: Colors.black, fontSize: 13, fontFamily: Fonts.label, lineHeight: 16 },
  rememberLabel: { color: Colors.textSecondary, fontSize: 14, fontFamily: Fonts.medium, flex: 1 },
  cta: { marginTop: 20 },
  hintRow: { alignItems: 'flex-start' },
});
