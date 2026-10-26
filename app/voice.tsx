import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn, FadeInDown, useSharedValue,
} from 'react-native-reanimated';
import BackButton from '../src/components/BackButton';
import ScreenBg from '../src/components/ScreenBg';
import VoiceStage from '../src/components/VoiceStage';
import { Blink, Meta } from '../src/components/Urban';
import { useI18n } from '../src/lib/i18n';
import { startVoice, VoiceCall, VoiceError, VoiceState } from '../src/lib/voice';
import { Colors, Fonts, displayType } from '../src/theme';

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.max(0, s) % 60).padStart(2, '0')}`;

export default function Voice() {
  const { t, lang } = useI18n();
  const router = useRouter();
  // /voice?voice=shimmer — try another voice without a new build.
  const { voice, demo } = useLocalSearchParams<{ voice?: string; demo?: string }>();
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<VoiceState>('connecting');
  const [error, setError] = useState<VoiceError | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [muted, setMuted] = useState(false);
  const call = useRef<VoiceCall | null>(null);
  const stateRef = useRef<VoiceState>('connecting');

  const energy = useSharedValue(0);
  const time = useSharedValue(0);
  const lime = useSharedValue(1);

  const begin = async () => {
    setError(null);
    call.current = await startVoice({
      lang,
      voice,
      onState: (s) => { stateRef.current = s; setState(s); },
      onRemaining: setRemaining,
      onError: (e) => {
        setError(e);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      },
    });
    if (call.current) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  useEffect(() => {
    // Dev only: /voice?demo=1 cycles through the call states without a call
    // (to tune the animation and for store screenshots).
    if (__DEV__ && demo) {
      const cycle: VoiceState[] = ['speaking', 'speaking', 'listening', 'userSpeaking', 'userSpeaking', 'listening'];
      let i = 0;
      setRemaining(272);
      const id = setInterval(() => { const s = cycle[i++ % cycle.length]; stateRef.current = s; setState(s); }, 1600);
      return () => clearInterval(id);
    }
    begin();
    return () => call.current?.stop();
  }, []);

  // Animation loop: real loudness on web, a lively stand-in on native.
  useEffect(() => {
    let raf = 0;
    const started = Date.now();
    const loop = () => {
      const s = stateRef.current;
      const sec = (Date.now() - started) / 1000;
      const lv = call.current?.levels() ?? { me: null, betina: null };
      let target = 0.12 + Math.sin(sec * 1.6) * 0.05; // idle breathing
      if (s === 'speaking') target = lv.betina ?? 0.55 + Math.sin(sec * 7) * 0.2 + Math.sin(sec * 13) * 0.15;
      else if (s === 'userSpeaking') target = lv.me ?? 0.45 + Math.sin(sec * 6) * 0.2;
      else if (s === 'connecting' || s === 'searching') target = 0.3 + Math.sin(sec * 5) * 0.25;
      else if (s === 'ended') target = 0;
      energy.value += (Math.max(0, Math.min(1, target)) - energy.value) * 0.25;
      time.value = sec;
      lime.value = s === 'userSpeaking' ? 0 : 1;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [energy, time, lime]);

  const end = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    call.current?.stop();
    call.current = null;
  };
  const toggleMute = () => {
    Haptics.selectionAsync();
    const next = !muted;
    setMuted(next);
    call.current?.setMuted(next);
  };

  const live = !error && state !== 'ended';
  const status = error
    ? { limit: t.voiceErrLimit, mic: t.voiceErrMic, network: t.voiceErrNetwork, auth: t.voiceErrAuth }[error]
    : { connecting: t.voiceConnecting, listening: t.voiceListening, userSpeaking: t.voiceYouSpeak, speaking: t.voiceSpeaking, searching: t.voiceSearching, ended: t.voiceEnded }[state];

  return (
    <ScreenBg>
      <View style={[styles.root, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.top}>
          <BackButton onPress={() => { end(); router.back(); }} />
          <View style={styles.live}>
            {live && <Blink color={Colors.live} size={7} />}
            <Meta color={live ? Colors.white : Colors.textMuted}>{live ? 'LIVE · VOICE' : 'VOICE'}</Meta>
          </View>
          <Meta color={Colors.primary}>{remaining != null ? t.voiceLeft.replace('{t}', clock(remaining)) : ' '}</Meta>
        </View>

        <Animated.View entering={FadeInDown.duration(400)} key={error ?? state} style={styles.statusWrap}>
          <Text style={[styles.status, error && styles.statusError]} numberOfLines={3}>
            {error ? status : (status ?? '').toUpperCase()}
          </Text>
        </Animated.View>

        {/* The moving centre */}
        <View style={styles.stage}>
          <VoiceStage energy={energy} time={time} lime={lime} />
        </View>

        <Text style={styles.hint}>{live ? t.voiceHint : ' '}</Text>

        {live ? (
          <Animated.View entering={FadeIn.duration(300)} style={styles.controls}>
            <Pressable onPress={toggleMute} style={({ pressed }) => [styles.mute, muted && styles.muteOn, pressed && { opacity: 0.8 }]}>
              <Text style={[styles.muteText, muted && { color: Colors.black }]}>{(muted ? t.voiceUnmute : t.voiceMute).toUpperCase()}</Text>
            </Pressable>
            <Pressable onPress={end} style={({ pressed }) => [styles.endBtn, pressed && { opacity: 0.85 }]}>
              <Text style={styles.endText}>{t.voiceEnd.toUpperCase()}</Text>
            </Pressable>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeIn.duration(300)} style={styles.controls}>
            {error === 'auth' && (
              <Pressable onPress={() => router.replace('/(auth)/login')} style={({ pressed }) => [styles.startBtn, pressed && { opacity: 0.85 }]}>
                <Text style={styles.startText}>{t.loginHeadline.toUpperCase()}</Text>
                <Text style={styles.startText}>→</Text>
              </Pressable>
            )}
            {error !== 'limit' && error !== 'auth' && (
              <Pressable onPress={begin} style={({ pressed }) => [styles.startBtn, pressed && { opacity: 0.85 }]}>
                <Text style={styles.startText}>{t.voiceStart.toUpperCase()}</Text>
                <Text style={styles.startText}>→</Text>
              </Pressable>
            )}
            <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.mute, pressed && { opacity: 0.8 }]}>
              <Text style={styles.muteText}>CHAT</Text>
            </Pressable>
          </Animated.View>
        )}
      </View>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 16 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  live: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusWrap: { minHeight: 96, justifyContent: 'flex-end', marginTop: 18 },
  status: { ...displayType(46, 46), color: Colors.white },
  statusError: { fontSize: 22, lineHeight: 28, fontFamily: Fonts.semibold, color: Colors.white },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hint: { color: Colors.textMuted, fontSize: 13, lineHeight: 18, fontFamily: Fonts.medium, textAlign: 'center', marginVertical: 14 },
  controls: { flexDirection: 'row', gap: 8 },
  mute: { borderWidth: 1.5, borderColor: Colors.borderStrong, paddingHorizontal: 18, justifyContent: 'center', minHeight: 58 },
  muteOn: { backgroundColor: Colors.white, borderColor: Colors.white },
  muteText: { color: Colors.white, fontSize: 16, fontFamily: Fonts.label, letterSpacing: 0.5 },
  endBtn: { flex: 1, backgroundColor: Colors.live, alignItems: 'center', justifyContent: 'center', minHeight: 58 },
  endText: { color: Colors.white, fontSize: 24, fontFamily: Fonts.display },
  startBtn: {
    flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.primary, paddingHorizontal: 16, minHeight: 58,
  },
  startText: { color: Colors.black, fontSize: 24, fontFamily: Fonts.display },
});
