import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn, FadeInDown, SharedValue, useAnimatedStyle, useSharedValue,
} from 'react-native-reanimated';
import BackButton from '../src/components/BackButton';
import BETinaAvatar from '../src/components/BETinaAvatar';
import ScreenBg from '../src/components/ScreenBg';
import { Blink, Meta } from '../src/components/Urban';
import { useI18n } from '../src/lib/i18n';
import { startVoice, VoiceCall, VoiceError, VoiceState } from '../src/lib/voice';
import { Colors, Fonts } from '../src/theme';

const BARS = 24;
const RINGS = [
  { size: 210, turn: 1, lag: 0 },
  { size: 260, turn: -1, lag: 0.35 },
  { size: 310, turn: 1, lag: 0.7 },
];

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.max(0, s) % 60).padStart(2, '0')}`;

/** One square ring around BETina: breathes with the voice energy and turns slowly. */
function Ring({ size, turn, lag, energy, time, lime }: {
  size: number; turn: number; lag: number; energy: SharedValue<number>; time: SharedValue<number>; lime: SharedValue<number>;
}) {
  const style = useAnimatedStyle(() => {
    const e = energy.value;
    const wobble = Math.sin(time.value * 2.2 + lag * 6) * 0.04 * (0.3 + e);
    return {
      opacity: 0.25 + e * 0.75 - lag * 0.15,
      borderColor: lime.value > 0.5 ? Colors.primary : Colors.white,
      transform: [
        { scale: 0.92 + e * (0.18 + lag * 0.12) + wobble },
        { rotate: `${turn * (time.value * (8 + lag * 10)) % 360}deg` },
      ],
    };
  });
  return <Animated.View style={[styles.ring, { width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2 }, style]} />;
}

/** Equalizer bar: height follows the energy with its own phase. */
function Bar({ i, energy, time, lime }: { i: number; energy: SharedValue<number>; time: SharedValue<number>; lime: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const centre = 1 - Math.abs(i - (BARS - 1) / 2) / (BARS / 2);
    const wave = (Math.sin(time.value * 9 + i * 0.9) + Math.sin(time.value * 5.3 + i * 1.7)) / 4 + 0.5;
    const h = 4 + energy.value * centre * 70 * (0.35 + wave * 0.65);
    return { height: h, backgroundColor: lime.value > 0.5 ? Colors.primary : Colors.white };
  });
  return <Animated.View style={[styles.bar, style]} />;
}

export default function Voice() {
  const { t, lang } = useI18n();
  const router = useRouter();
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
      else if (s === 'connecting') target = 0.25 + Math.sin(sec * 4) * 0.2;
      else if (s === 'ended') target = 0;
      energy.value += (Math.max(0, Math.min(1, target)) - energy.value) * 0.25;
      time.value = sec;
      lime.value = s === 'userSpeaking' ? 0 : 1;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [energy, time, lime]);

  const avatarStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 + energy.value * 0.08 }] }));

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
    : { connecting: t.voiceConnecting, listening: t.voiceListening, userSpeaking: t.voiceYouSpeak, speaking: t.voiceSpeaking, ended: t.voiceEnded }[state];

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
          {RINGS.map((r) => <Ring key={r.size} {...r} energy={energy} time={time} lime={lime} />)}
          <Animated.View style={[styles.avatar, avatarStyle]}>
            <BETinaAvatar size={150} online={live} />
          </Animated.View>
        </View>

        <View style={styles.eq}>
          {Array.from({ length: BARS }, (_, i) => <Bar key={i} i={i} energy={energy} time={time} lime={lime} />)}
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
  status: { color: Colors.white, fontSize: 46, lineHeight: 46, fontFamily: Fonts.display },
  statusError: { fontSize: 22, lineHeight: 28, fontFamily: Fonts.semibold, color: Colors.white },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', left: '50%', top: '50%', borderWidth: 2 },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  eq: { height: 80, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  bar: { width: 6 },
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
