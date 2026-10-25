import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
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
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import BETinaAvatar from '../components/BETinaAvatar';
import ChatBubble from '../components/ChatBubble';
import ScreenBg from '../components/ScreenBg';
import { Blink, Meta } from '../components/Urban';
import { askBetina } from '../lib/claude';
import { fetchMemories } from '../lib/memory';
import { XP_REWARDS, awardChatXp } from '../lib/xp';
import { LiveContext, fetchLiveContext, formatKickoff, parseSports } from '../lib/sports';
import { supabase } from '../lib/supabase';
import { useProfile } from '../hooks/useProfile';
import { useSession } from '../hooks/useSession';
import SignInWall from '../components/SignInWall';
import { useI18n } from '../lib/i18n';
import { useChrome } from '../components/chrome';
import { Colors, Fonts } from '../theme';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  at: string; // ISO time
  xp?: boolean;
};

function TypingDot({ delay }: { delay: number }) {
  const opacity = useSharedValue(0.3);
  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.3, { duration: 600, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
      ),
    );
  }, [delay, opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[styles.typingDot, style]} />;
}

export default function Chat() {
  const { t, lang } = useI18n();
  const { profile, bumpXp } = useProfile();
  const session = useSession();
  const userName = profile?.name ?? 'friend';
  const quickReplies = [t.chatQuick1, t.chatQuick2, t.chatQuick3];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const chrome = useChrome();
  const [messages, setMessages] = useState<Message[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // Load the persisted conversation from Supabase once on mount
  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from('chat_messages')
            .select('id, role, content, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true })
            .limit(50);
          if (data && data.length > 0) {
            setMessages(
              data.map((r) => ({
                id: r.id,
                role: r.role as 'user' | 'assistant',
                content: r.content,
                at: r.created_at,
              })),
            );
          }
        }
      } catch {
        // offline / demo — start with a fresh chat
      } finally {
        setHistoryLoaded(true);
      }
    })();
  }, []);

  // Seed (or re-localize on language switch) the welcome bubble while the
  // chat is still untouched — never wipe a real conversation.
  useEffect(() => {
    if (!historyLoaded) return;
    setMessages((prev) =>
      prev.length === 0 || (prev.length === 1 && prev[0].id === 'm1')
        ? [{ id: 'm1', role: 'assistant', content: t.chatWelcome.replace('{name}', userName), at: new Date().toISOString() }]
        : prev,
    );
  }, [historyLoaded, userName, t]);

  // Fire-and-forget persistence; chat keeps working if Supabase is unreachable
  const persist = (role: 'user' | 'assistant', content: string) => {
    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (data.user) {
          return supabase.from('chat_messages').insert({ user_id: data.user.id, role, content });
        }
      })
      .then((res) => {
        if (res?.error) console.warn('chat persist failed:', res.error.message);
      })
      .catch(() => {});
  };
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [live, setLive] = useState<LiveContext | null>(null);
  const [memories, setMemories] = useState<string[]>([]);
  const scrollRef = useRef<ScrollView>(null);

  // Load what BETina remembers about the player, once on mount.
  useEffect(() => {
    let active = true;
    fetchMemories().then((m) => { if (active) setMemories(m); });
    return () => { active = false; };
  }, []);

  // Pull the real fixtures/results/headlines once the profile is known, so
  // BETina can answer with concrete data instead of "I can't see live info".
  useEffect(() => {
    if (!profile) return;
    let active = true;
    fetchLiveContext(
      profile.favourite_team_id,
      profile.favourite_team,
      profile.favourite_team_sport ?? profile.favourite_sport,
      lang,
    ).then((ctx) => { if (active) setLive(ctx); });
    return () => { active = false; };
  }, [profile?.favourite_team_id, profile?.favourite_team, lang]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || typing) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInput('');
    const userMsg: Message = { id: `u${Date.now()}`, role: 'user', content: trimmed, at: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setTyping(true);

    const history = [...messages, userMsg].map(({ role, content }) => ({ role, content }));
    persist('user', trimmed);

    // +1 XP for the message: bump the UI instantly, persist in the background.
    // If the write fails it self-corrects on the next focus reload.
    bumpXp(XP_REWARDS.chatMessage);
    awardChatXp();

    const reply = await askBetina(history, {
      name: userName,
      lang,
      team: profile?.favourite_team,
      teamSport: profile?.favourite_team_sport,
      teamLeague: profile?.favourite_team_league,
      sports: parseSports(profile?.favourite_sports),
      tier: profile?.vip_tier,
      xp: profile?.xp_points,
      streakDays: profile?.streak_days,
      live,
      memories,
    });
    persist('assistant', reply);

    setTyping(false);
    setMessages((prev) => [
      ...prev,
      { id: `a${Date.now()}`, role: 'assistant', content: reply, at: new Date().toISOString(), xp: true },
    ]);
  };

  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(t);
  }, [messages, typing]);

  // Guest → chatting needs an account; gate it. (Apple 5.1.1(v))
  if (session === undefined) return <ScreenBg />;
  if (session === null) return <SignInWall />;

  const time = (iso: string) => new Date(iso).toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' });
  // The topic bar names the favourite team's next match, if there is one.
  const next = live?.next?.[0];
  const topic = next
    ? `${t.chatTopic}: ${next.home} – ${next.away} · ${formatKickoff(next.date, next.time, lang, { today: t.homeToday, tomorrow: t.homeTomorrow })}`
    : null;

  return (
    <ScreenBg>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        {/* Status bar: BETina online / topic + tier & XP */}
        <View style={[styles.bar, { marginTop: chrome.top }]}>
          <View style={styles.barLeft}>
            {topic ? (
              <Text style={styles.barText} numberOfLines={1}>{topic.toUpperCase()}</Text>
            ) : (
              <>
                <Blink color={Colors.black} size={7} />
                <Text style={styles.barText}>BETINA · ONLINE</Text>
              </>
            )}
          </View>
          {profile && (
            <Text style={styles.barMeta} numberOfLines={1}>{`${(profile.xp_points ?? 0).toLocaleString(lang)} XP`}</Text>
          )}
        </View>

        {/* messages */}
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.messages}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.day}>
            <BETinaAvatar size={64} online />
            <Meta>{`— ${t.chatToday} —`}</Meta>
          </View>
          {messages.map((msg) => (
            <Animated.View
              key={msg.id}
              entering={FadeInDown.duration(300)}
              style={msg.role === 'user' ? styles.userWrap : styles.betinaWrap}
            >
              <ChatBubble role={msg.role}>{msg.content}</ChatBubble>
              <Meta style={styles.stamp} color={msg.xp ? Colors.primary : Colors.textMuted}>
                {msg.role === 'user' ? time(msg.at) : `BETINA · ${time(msg.at)}${msg.xp ? ` · +${XP_REWARDS.chatMessage} XP` : ''}`}
              </Meta>
            </Animated.View>
          ))}

          {typing && (
            <Animated.View entering={FadeInDown.duration(300)} style={styles.betinaWrap}>
              <View style={styles.typingBubble}>
                <TypingDot delay={0} />
                <TypingDot delay={200} />
                <TypingDot delay={400} />
              </View>
            </Animated.View>
          )}
        </ScrollView>

        {/* quick replies + input */}
        <View style={[styles.inputBlock, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickReplies}
          >
            {quickReplies.map((qr) => (
              <Pressable
                key={qr}
                onPress={() => send(qr)}
                style={({ pressed }) => [styles.quickReply, pressed && styles.quickReplyPressed]}
              >
                <Text style={styles.quickReplyLabel}>{qr.toUpperCase()}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <View style={styles.inputRow}>
            {/* Voice chat with BETina (own page, app/voice.tsx) */}
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/voice'); }}
              style={({ pressed }) => [styles.micButton, pressed && styles.micPressed]}
              accessibilityLabel={t.voiceStart}
            >
              <View style={styles.micBody} />
              <View style={styles.micCup} />
              <View style={styles.micStand} />
            </Pressable>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder={t.chatPlaceholder}
              placeholderTextColor={Colors.textMuted}
              style={styles.input}
              onSubmitEditing={() => send(input)}
              returnKeyType="send"
            />
            <Pressable
              onPress={() => send(input)}
              style={({ pressed }) => [styles.sendButton, (pressed || typing) && styles.sendPressed]}
            >
              <Text style={styles.sendLabel}>→</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },

  bar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10,
    backgroundColor: Colors.primary, paddingHorizontal: 16, height: 32,
  },
  barLeft: { flexDirection: 'row', alignItems: 'center', gap: 7, flexShrink: 1 },
  barText: { color: Colors.black, fontSize: 13, fontFamily: Fonts.label, letterSpacing: 0.5, flexShrink: 1 },
  barMeta: { color: Colors.black, fontSize: 10, fontFamily: Fonts.monoBold, letterSpacing: 0.6, flexShrink: 0 },

  messages: { gap: 14, paddingHorizontal: 16, paddingTop: 18, paddingBottom: 8 },
  day: { alignItems: 'center', gap: 10, paddingBottom: 6 },
  betinaWrap: { alignItems: 'flex-start', gap: 5 },
  userWrap: { alignItems: 'flex-end', gap: 5 },
  stamp: { fontSize: 9 },

  typingBubble: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.border,
    paddingVertical: 15, paddingHorizontal: 16,
  },
  typingDot: { width: 7, height: 7, backgroundColor: Colors.primary },

  inputBlock: { gap: 10, paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.line },
  quickReplies: { gap: 6 },
  quickReply: { borderWidth: 1.5, borderColor: Colors.borderStrong, paddingVertical: 8, paddingHorizontal: 12 },
  quickReplyPressed: { borderColor: Colors.primary, backgroundColor: Colors.card },
  quickReplyLabel: { color: Colors.white, fontSize: 14, fontFamily: Fonts.label, letterSpacing: 0.5 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    flex: 1, height: 50, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface,
    paddingHorizontal: 14, color: Colors.white, fontSize: 16, fontFamily: Fonts.medium,
  },
  micButton: {
    width: 50, height: 50, borderWidth: 1.5, borderColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  micPressed: { backgroundColor: Colors.card },
  micBody: { width: 10, height: 16, backgroundColor: Colors.primary },
  micCup: { width: 18, height: 6, borderWidth: 2, borderTopWidth: 0, borderColor: Colors.primary, marginTop: -3 },
  micStand: { width: 2, height: 5, backgroundColor: Colors.primary },
  sendButton: { width: 50, height: 50, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendPressed: { opacity: 0.7 },
  sendLabel: { color: Colors.black, fontSize: 24, fontFamily: Fonts.display },
});
