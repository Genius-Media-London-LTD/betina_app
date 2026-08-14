import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import Animated, { FadeInDown } from 'react-native-reanimated';
import GlowButton from '../../src/components/GlowButton';
import GlowCard from '../../src/components/GlowCard';
import ScreenBg from '../../src/components/ScreenBg';
import SectionLabel from '../../src/components/SectionLabel';
import Toggle from '../../src/components/Toggle';
import { useProfile } from '../../src/hooks/useProfile';
import { LANGUAGES, LangCode, useI18n } from '../../src/lib/i18n';
import { supabase } from '../../src/lib/supabase';
import { Colors, Fonts, Spacing, Typography } from '../../src/theme';


function Row({
  emoji, label, value, onPress, right, last,
}: {
  emoji: string; label: string; value?: string;
  onPress?: () => void; right?: React.ReactNode; last?: boolean;
}) {
  return (
    <>
      <Pressable onPress={onPress} disabled={!onPress} style={styles.row}>
        <Text style={styles.rowEmoji}>{emoji}</Text>
        <Text style={styles.rowLabel}>{label}</Text>
        {value && <Text style={styles.rowValue}>{value}</Text>}
        {right ?? (onPress && <Text style={styles.rowChevron}>›</Text>)}
      </Pressable>
      {!last && <View style={styles.divider} />}
    </>
  );
}

export default function Settings() {
  const { profile, phone } = useProfile();
  const { lang, setLang, t } = useI18n();
  const name = profile?.name ?? '...';
  const tier = profile?.vip_tier ?? 'INITIATE';
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [eventReminders, setEventReminders] = useState(true);
  const [betinaMessages, setBetinaMessages] = useState(true);
  const [tierUpdates, setTierUpdates] = useState(false);

  // Load saved notification preferences (degrades gracefully if the columns
  // aren't there yet — migration 004).
  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data, error } = await supabase
          .from('profiles')
          .select('notify_events, notify_betina, notify_tier')
          .eq('id', user.id)
          .maybeSingle();
        if (!error && data) {
          if (typeof data.notify_events === 'boolean') setEventReminders(data.notify_events);
          if (typeof data.notify_betina === 'boolean') setBetinaMessages(data.notify_betina);
          if (typeof data.notify_tier === 'boolean') setTierUpdates(data.notify_tier);
        }
      } catch {
        // keep defaults
      }
    })();
  }, []);

  const savePref = (column: 'notify_events' | 'notify_betina' | 'notify_tier', value: boolean) => {
    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (data.user) {
          return supabase.from('profiles').update({ [column]: value }).eq('id', data.user.id);
        }
      })
      .then((res) => {
        if (res?.error) console.warn('notify pref save failed:', res.error.message);
      })
      .catch(() => {});
  };

  // Language picker state
  const [langModalOpen, setLangModalOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState<LangCode>(lang);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const currentLangInfo = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  const saveLang = async () => {
    setSaving(true);
    await setLang(selectedLang);
    // Also persist to Supabase profile
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').upsert({ id: user.id, language: selectedLang });
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => { setSaved(false); setLangModalOpen(false); }, 1200);
  };

  const logout = async () => {
    // Clear device token (SecureStore is unavailable on web — don't let it
    // throw and block sign-out).
    try {
      await SecureStore.deleteItemAsync('betina_device_token');
      await SecureStore.deleteItemAsync('betina_device_phone');
    } catch {
      // no-op on web
    }
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  };

  // Account deletion (Apple 5.1.1(v) / Google requirement — must be doable
  // in-app). Confirmation dialog → server-side wipe via the delete-account
  // Edge Function → clear local session → back to login.
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

  const deleteAccount = async () => {
    setDeleting(true);
    setDeleteError(false);
    try {
      const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
      if (error) throw error;
      await SecureStore.deleteItemAsync('betina_device_token');
      await SecureStore.deleteItemAsync('betina_device_phone');
      await supabase.auth.signOut();
      setDeleteModalOpen(false);
      router.replace('/(auth)/login');
    } catch {
      setDeleting(false);
      setDeleteError(true);
    }
  };

  return (
    <ScreenBg glowTop={0.12} glowSize={440}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.lg, paddingBottom: 130 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(500)}>
          <Text style={styles.title}>{t.settingsTitle}</Text>
        </Animated.View>

        {/* Profile card */}
        <Animated.View entering={FadeInDown.delay(80).duration(500)}>
          <GlowCard style={styles.profileCard}>
            <View style={styles.profileInitial}>
              <Text style={styles.profileInitialLabel}>{(name[0] || '?').toUpperCase()}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName} numberOfLines={1}>{name}</Text>
              <Text style={styles.profileMeta}>{phone ?? '—'}</Text>
            </View>
            <View style={styles.tierPill}>
              <View style={styles.tierDot} />
              <Text style={styles.tierPillLabel}>{tier}</Text>
            </View>
          </GlowCard>
        </Animated.View>

        {/* General */}
        <Animated.View entering={FadeInDown.delay(140).duration(500)} style={styles.section}>
          <SectionLabel>{t.settingsGeneral}</SectionLabel>
          <GlowCard>
            <Row
              emoji="🌐"
              label={t.settingsLanguage}
              value={`${currentLangInfo.flag} ${currentLangInfo.nativeName}`}
              onPress={() => { setSelectedLang(lang); setLangModalOpen(true); }}
              last
            />
          </GlowCard>
        </Animated.View>

        {/* Notifications */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.section}>
          <SectionLabel>{t.settingsPush}</SectionLabel>
          <GlowCard>
            <Row emoji="⚽" label={t.settingsEventReminders} right={<Toggle value={eventReminders} onValueChange={(v) => { setEventReminders(v); savePref('notify_events', v); }} />} />
            <Row emoji="💬" label={t.settingsBetinaMsgs} right={<Toggle value={betinaMessages} onValueChange={(v) => { setBetinaMessages(v); savePref('notify_betina', v); }} />} />
            <Row emoji="🏆" label={t.settingsTierUpdates} right={<Toggle value={tierUpdates} onValueChange={(v) => { setTierUpdates(v); savePref('notify_tier', v); }} />} last />
          </GlowCard>
        </Animated.View>

        {/* Support */}
        <Animated.View entering={FadeInDown.delay(260).duration(500)} style={styles.section}>
          <SectionLabel>{t.settingsSupport}</SectionLabel>
          <GlowCard>
            <Row emoji="💡" label={t.settingsHelp} onPress={() => router.push('/help')} />
            <Row emoji="🛡️" label={t.settingsResponsible} onPress={() => router.push('/responsible-gaming')} />
            <Row emoji="📄" label={t.settingsTermsPrivacy} onPress={() => router.push('/legal')} last />
          </GlowCard>
        </Animated.View>

        {/* Logout */}
        <Animated.View entering={FadeInDown.delay(320).duration(500)} style={styles.section}>
          <GlowButton label={t.settingsLogout} variant="danger" onPress={logout} />
          <Pressable
            onPress={() => { setDeleteError(false); setDeleteModalOpen(true); }}
            style={styles.deleteLink}
            hitSlop={8}
          >
            <Text style={styles.deleteLinkLabel}>{t.settingsDeleteAccount}</Text>
          </Pressable>
          <Text style={styles.version}>BETina v1.0 · powered by GeniusBet</Text>
        </Animated.View>
      </ScrollView>

      {/* ── Language Picker Modal ── */}
      <Modal visible={langModalOpen} transparent animationType="slide" onRequestClose={() => setLangModalOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setLangModalOpen(false)} />
        <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>{t.settingsLanguage}</Text>

          <ScrollView style={styles.langList} showsVerticalScrollIndicator={false}>
            {LANGUAGES.map((l) => {
              const active = l.code === selectedLang;
              return (
                <Pressable
                  key={l.code}
                  onPress={() => setSelectedLang(l.code)}
                  style={[styles.langRow, active && styles.langRowActive]}
                >
                  <Text style={styles.langFlag}>{l.flag}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.langNative, active && styles.langNativeActive]}>{l.nativeName}</Text>
                    <Text style={styles.langLabel}>{l.label}</Text>
                  </View>
                  {active && <Text style={styles.langCheck}>✓</Text>}
                </Pressable>
              );
            })}
          </ScrollView>

          <Pressable
            onPress={saveLang}
            disabled={saving}
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          >
            <Text style={styles.saveBtnLabel}>
              {saved ? t.settingsSaved : saving ? '…' : t.settingsSave}
            </Text>
          </Pressable>
        </View>
      </Modal>

      {/* ── Delete Account Confirmation ── */}
      <Modal visible={deleteModalOpen} transparent animationType="fade" onRequestClose={() => { if (!deleting) setDeleteModalOpen(false); }}>
        <View style={styles.deleteCenter}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => { if (!deleting) setDeleteModalOpen(false); }} />
          <View style={styles.deleteDialog}>
            <Text style={styles.deleteDialogEmoji}>⚠️</Text>
            <Text style={styles.deleteDialogTitle}>{t.deleteAcctTitle}</Text>
            <Text style={styles.deleteDialogBody}>{t.deleteAcctBody}</Text>
            {deleteError && <Text style={styles.deleteDialogError}>{t.deleteAcctFailed}</Text>}
            <Pressable
              onPress={deleteAccount}
              disabled={deleting}
              style={[styles.deleteConfirmBtn, deleting && { opacity: 0.6 }]}
            >
              <Text style={styles.deleteConfirmLabel}>{deleting ? t.deleteAcctWorking : t.deleteAcctConfirm}</Text>
            </Pressable>
            <Pressable onPress={() => { if (!deleting) setDeleteModalOpen(false); }} disabled={deleting} style={styles.deleteCancelBtn}>
              <Text style={styles.deleteCancelLabel}>{t.deleteAcctCancel}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: Spacing.lg, gap: Spacing.md },
  title: { color: '#FFF', fontSize: 26, fontFamily: Fonts.bold },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: 14, paddingHorizontal: 16 },
  profileInitial: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(184,233,38,0.12)', borderWidth: 1, borderColor: 'rgba(184,233,38,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  profileInitialLabel: { color: Colors.primary, fontSize: Typography.md + 1, fontFamily: Fonts.bold },
  profileInfo: { flex: 1, gap: 1 },
  profileName: { color: '#FFF', fontSize: Typography.base + 1, fontFamily: Fonts.bold },
  profileMeta: { color: Colors.textSecondary, fontSize: Typography.xs + 1, fontFamily: Fonts.medium },
  tierPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(184,233,38,0.1)', borderWidth: 1, borderColor: 'rgba(184,233,38,0.3)',
    borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12,
  },
  tierDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.primary },
  tierPillLabel: { color: Colors.primary, fontSize: Typography.xs, fontFamily: Fonts.bold, letterSpacing: 0.6 },
  section: { gap: Spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: 12, paddingHorizontal: 16 },
  rowEmoji: { fontSize: 17 },
  rowLabel: { flex: 1, color: '#FFF', fontSize: Typography.sm + 1, fontFamily: Fonts.semibold },
  rowValue: { color: Colors.textSecondary, fontSize: Typography.sm, fontFamily: Fonts.medium },
  rowChevron: { color: '#55556A', fontSize: Typography.sm + 1 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginHorizontal: 16 },
  version: { textAlign: 'center', color: '#3A3A4A', fontSize: Typography.xs, fontFamily: Fonts.medium, paddingTop: Spacing.xs },

  // Modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  modalSheet: {
    backgroundColor: '#0F0F1F', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: Spacing.lg, paddingTop: 12, maxHeight: '75%',
  },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#3A3A4A', alignSelf: 'center', marginBottom: 16 },
  modalTitle: { color: '#FFF', fontSize: Typography.lg, fontFamily: Fonts.bold, marginBottom: 16 },
  langList: { maxHeight: 380 },
  langRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, paddingHorizontal: 12, borderRadius: 12, marginBottom: 4,
  },
  langRowActive: { backgroundColor: 'rgba(184,233,38,0.08)', borderWidth: 1, borderColor: 'rgba(184,233,38,0.2)' },
  langFlag: { fontSize: 28 },
  langNative: { color: '#FFF', fontSize: Typography.base, fontFamily: Fonts.semibold },
  langNativeActive: { color: Colors.primary },
  langLabel: { color: Colors.textSecondary, fontSize: Typography.xs + 1, fontFamily: Fonts.medium, marginTop: 2 },
  langCheck: { color: Colors.primary, fontSize: Typography.base + 2, fontFamily: Fonts.bold },
  saveBtn: {
    marginTop: 12, backgroundColor: Colors.primary,
    borderRadius: 999, paddingVertical: 14, alignItems: 'center',
  },
  saveBtnLabel: { color: '#000', fontFamily: Fonts.bold, fontSize: Typography.base },

  // Delete account
  deleteLink: { alignItems: 'center', paddingVertical: 12, marginTop: 2 },
  deleteLinkLabel: { color: Colors.danger, fontSize: Typography.sm + 1, fontFamily: Fonts.semibold },
  deleteCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.65)', padding: 28 },
  deleteDialog: {
    width: '100%', maxWidth: 380, backgroundColor: '#14111A',
    borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,122,122,0.3)',
    paddingHorizontal: 22, paddingTop: 22, paddingBottom: 14, alignItems: 'center',
  },
  deleteDialogEmoji: { fontSize: 34, marginBottom: 10 },
  deleteDialogTitle: { color: '#FFF', fontSize: Typography.lg, fontFamily: Fonts.bold, textAlign: 'center', marginBottom: 8 },
  deleteDialogBody: { color: Colors.textSecondary, fontSize: Typography.sm, fontFamily: Fonts.medium, textAlign: 'center', lineHeight: 20, marginBottom: 18 },
  deleteDialogError: { color: Colors.danger, fontSize: Typography.sm, fontFamily: Fonts.medium, textAlign: 'center', marginBottom: 14 },
  deleteConfirmBtn: {
    width: '100%', backgroundColor: Colors.danger,
    borderRadius: 999, paddingVertical: 14, alignItems: 'center', marginBottom: 4,
  },
  deleteConfirmLabel: { color: '#2A0A0A', fontFamily: Fonts.bold, fontSize: Typography.base },
  deleteCancelBtn: { width: '100%', paddingVertical: 14, alignItems: 'center' },
  deleteCancelLabel: { color: Colors.textSecondary, fontFamily: Fonts.semibold, fontSize: Typography.base },
});
