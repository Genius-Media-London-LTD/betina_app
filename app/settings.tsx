import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import Animated, { FadeInDown } from 'react-native-reanimated';
import GlowButton from '../src/components/GlowButton';
import GlowCard from '../src/components/GlowCard';
import ScreenBg from '../src/components/ScreenBg';
import SectionLabel from '../src/components/SectionLabel';
import Toggle from '../src/components/Toggle';
import { useProfile } from '../src/hooks/useProfile';
import { useSession } from '../src/hooks/useSession';
import { LANGUAGES, LangCode, useI18n } from '../src/lib/i18n';
import { signOut } from '../src/lib/session';
import { supabase } from '../src/lib/supabase';
import { Meta } from '../src/components/Urban';
import { Colors, Fonts } from '../src/theme';


function Row({
  emoji, label, value, onPress, right, last,
}: {
  /** Kept for call-site readability; the urban rows show no emoji. */
  emoji: string; label: string; value?: string;
  onPress?: () => void; right?: React.ReactNode; last?: boolean;
}) {
  return (
    <>
      <Pressable onPress={onPress} disabled={!onPress} style={styles.row}>
        <Text style={styles.rowLabel}>{label.toUpperCase()}</Text>
        {value && <Text style={styles.rowValue} numberOfLines={1}>{value.toUpperCase()}</Text>}
        {right ?? (onPress && <Text style={styles.rowChevron}>→</Text>)}
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
  const session = useSession();
  const guest = session === null;

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
    await signOut();
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
    <ScreenBg>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(500)}>
          <Text style={styles.title}>{t.settingsTitle.toUpperCase()}<Text style={{ color: Colors.primary }}>.</Text></Text>
        </Animated.View>

        {/* Profile card (or a sign-in prompt for guests) */}
        <Animated.View entering={FadeInDown.delay(80).duration(500)}>
          {guest ? (
            <GlowCard style={styles.profileCard}>
              <View style={styles.profileInitial}>
                <Text style={styles.profileInitialLabel}>?</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName} numberOfLines={1}>{t.guestTitle.toUpperCase()}</Text>
                <Text style={styles.profileMeta} numberOfLines={2}>{t.guestBody}</Text>
              </View>
            </GlowCard>
          ) : (
            <GlowCard style={styles.profileCard}>
              <View style={styles.profileInitial}>
                <Text style={styles.profileInitialLabel}>{(name[0] || '?').toUpperCase()}</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName} numberOfLines={1}>{name.toUpperCase()}</Text>
                <Meta>{`${phone ?? '—'} · ${tier}`}</Meta>
              </View>
            </GlowCard>
          )}
        </Animated.View>

        {/* General */}
        <Animated.View entering={FadeInDown.delay(140).duration(500)} style={styles.section}>
          <SectionLabel>{t.settingsGeneral}</SectionLabel>
          <GlowCard>
            <Row
              emoji="🌐"
              label={t.settingsLanguage}
              value={currentLangInfo.nativeName}
              onPress={() => { setSelectedLang(lang); setLangModalOpen(true); }}
              last
            />
          </GlowCard>
        </Animated.View>

        {/* Notifications (account-based → hidden for guests) */}
        {!guest && (
          <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.section}>
            <SectionLabel>{t.settingsPush}</SectionLabel>
            <GlowCard>
              <Row emoji="⚽" label={t.settingsEventReminders} right={<Toggle value={eventReminders} onValueChange={(v) => { setEventReminders(v); savePref('notify_events', v); }} />} />
              <Row emoji="💬" label={t.settingsBetinaMsgs} right={<Toggle value={betinaMessages} onValueChange={(v) => { setBetinaMessages(v); savePref('notify_betina', v); }} />} />
              <Row emoji="🏆" label={t.settingsTierUpdates} right={<Toggle value={tierUpdates} onValueChange={(v) => { setTierUpdates(v); savePref('notify_tier', v); }} />} last />
            </GlowCard>
          </Animated.View>
        )}

        {/* Support */}
        <Animated.View entering={FadeInDown.delay(260).duration(500)} style={styles.section}>
          <SectionLabel>{t.settingsSupport}</SectionLabel>
          <GlowCard>
            <Row emoji="💡" label={t.settingsHelp} onPress={() => router.push('/help')} />
            <Row emoji="🛡️" label={t.settingsResponsible} onPress={() => router.push('/responsible-gaming')} />
            <Row emoji="📄" label={t.settingsTermsPrivacy} onPress={() => router.push('/legal')} last />
          </GlowCard>
        </Animated.View>

        {/* Account actions — guests get a sign-in CTA instead of logout/delete */}
        <Animated.View entering={FadeInDown.delay(320).duration(500)} style={styles.section}>
          {guest ? (
            <GlowButton label={t.guestCta} onPress={() => router.replace('/(auth)/login')} />
          ) : (
            <>
              <GlowButton label={t.settingsLogout} variant="danger" onPress={logout} />
              <Pressable
                onPress={() => { setDeleteError(false); setDeleteModalOpen(true); }}
                style={styles.deleteLink}
                hitSlop={8}
              >
                <Text style={styles.deleteLinkLabel}>{t.settingsDeleteAccount.toUpperCase()}</Text>
              </Pressable>
            </>
          )}
          <Text style={styles.version}>BETINA V1.0 · POWERED BY GENIUSBET · 18+</Text>
        </Animated.View>
      </ScrollView>

      {/* ── Language Picker Modal ── */}
      <Modal visible={langModalOpen} transparent animationType="slide" onRequestClose={() => setLangModalOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setLangModalOpen(false)} />
        <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
          <Text style={styles.modalTitle}>{t.settingsLanguage.toUpperCase()}</Text>

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
                    <Text style={[styles.langNative, active && styles.langNativeActive]}>{l.nativeName.toUpperCase()}</Text>
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
              {(saved ? t.settingsSaved : saving ? '…' : t.settingsSave).toUpperCase()}
            </Text>
          </Pressable>
        </View>
      </Modal>

      {/* ── Delete Account Confirmation ── */}
      <Modal visible={deleteModalOpen} transparent animationType="fade" onRequestClose={() => { if (!deleting) setDeleteModalOpen(false); }}>
        <View style={styles.deleteCenter}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => { if (!deleting) setDeleteModalOpen(false); }} />
          <View style={styles.deleteDialog}>
            <Text style={styles.deleteDialogTitle}>{t.deleteAcctTitle.toUpperCase()}</Text>
            <Text style={styles.deleteDialogBody}>{t.deleteAcctBody}</Text>
            {deleteError && <Text style={styles.deleteDialogError}>{t.deleteAcctFailed}</Text>}
            <Pressable
              onPress={deleteAccount}
              disabled={deleting}
              style={[styles.deleteConfirmBtn, deleting && { opacity: 0.6 }]}
            >
              <Text style={styles.deleteConfirmLabel}>{(deleting ? t.deleteAcctWorking : t.deleteAcctConfirm).toUpperCase()}</Text>
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
  content: { paddingHorizontal: 16, gap: 14 },
  title: { color: Colors.white, fontSize: 64, lineHeight: 66, fontFamily: Fonts.display },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 12 },
  profileInitial: { width: 48, height: 48, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  profileInitialLabel: { color: Colors.black, fontSize: 28, fontFamily: Fonts.display },
  profileInfo: { flex: 1, gap: 3 },
  profileName: { color: Colors.white, fontSize: 24, lineHeight: 26, fontFamily: Fonts.display },
  profileMeta: { color: Colors.textSecondary, fontSize: 13, fontFamily: Fonts.medium, lineHeight: 18 },
  section: { gap: 6, marginTop: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: 14 },
  rowLabel: { flex: 1, color: Colors.white, fontSize: 17, fontFamily: Fonts.label, letterSpacing: 0.3 },
  rowValue: { color: Colors.textMuted, fontSize: 10, fontFamily: Fonts.mono, letterSpacing: 0.8, maxWidth: '45%' },
  rowChevron: { color: Colors.primary, fontSize: 16, fontFamily: Fonts.label },
  divider: { height: 1, backgroundColor: Colors.line, marginHorizontal: 14 },
  version: { textAlign: 'center', color: Colors.textMuted, fontSize: 9, fontFamily: Fonts.mono, letterSpacing: 0.8, paddingTop: 6 },

  // Modal
  modalBackdrop: { flex: 1, backgroundColor: Colors.overlay },
  modalSheet: {
    backgroundColor: Colors.black, borderTopWidth: 3, borderTopColor: Colors.primary,
    paddingHorizontal: 16, paddingTop: 16, maxHeight: '75%',
  },
  modalTitle: { color: Colors.white, fontSize: 28, fontFamily: Fonts.display, marginBottom: 12 },
  langList: { maxHeight: 380 },
  langRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, paddingHorizontal: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.line,
  },
  langRowActive: { backgroundColor: Colors.primary },
  langFlag: { fontSize: 26 },
  langNative: { color: Colors.white, fontSize: 18, fontFamily: Fonts.label, letterSpacing: 0.3 },
  langNativeActive: { color: Colors.black },
  langLabel: { color: Colors.textMuted, fontSize: 10, fontFamily: Fonts.mono, letterSpacing: 0.8, marginTop: 2 },
  langCheck: { color: Colors.black, fontSize: 18, fontFamily: Fonts.label },
  saveBtn: { marginTop: 12, backgroundColor: Colors.primary, paddingVertical: 15, alignItems: 'center' },
  saveBtnLabel: { color: Colors.black, fontFamily: Fonts.display, fontSize: 20 },

  // Delete account
  deleteLink: { alignItems: 'center', paddingVertical: 12, marginTop: 2 },
  deleteLinkLabel: { color: Colors.danger, fontSize: 11, fontFamily: Fonts.mono, letterSpacing: 0.8 },
  deleteCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.overlay, padding: 24 },
  deleteDialog: {
    width: '100%', maxWidth: 380, backgroundColor: Colors.black, borderWidth: 1.5, borderColor: Colors.danger,
    paddingHorizontal: 18, paddingTop: 20, paddingBottom: 10,
  },
  deleteDialogTitle: { color: Colors.white, fontSize: 30, lineHeight: 32, fontFamily: Fonts.display, marginBottom: 10 },
  deleteDialogBody: { color: Colors.textSecondary, fontSize: 14, fontFamily: Fonts.medium, lineHeight: 20, marginBottom: 18 },
  deleteDialogError: { color: Colors.danger, fontSize: 14, fontFamily: Fonts.medium, marginBottom: 14 },
  deleteConfirmBtn: { width: '100%', backgroundColor: Colors.danger, paddingVertical: 15, alignItems: 'center', marginBottom: 4 },
  deleteConfirmLabel: { color: Colors.black, fontFamily: Fonts.display, fontSize: 20 },
  deleteCancelBtn: { width: '100%', paddingVertical: 14, alignItems: 'center' },
  deleteCancelLabel: { color: Colors.textSecondary, fontFamily: Fonts.label, fontSize: 15, letterSpacing: 0.5 },
});
