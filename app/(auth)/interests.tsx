import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import BackButton from '../../src/components/BackButton';
import GlowButton from '../../src/components/GlowButton';
import ScreenBg from '../../src/components/ScreenBg';
import { Headline } from '../../src/components/Urban';
import { sports } from '../../src/lib/demo';
import { SPORT_KEYS, useI18n } from '../../src/lib/i18n';
import { supabase } from '../../src/lib/supabase';
import { NEWS_API } from '../../src/lib/sports';
import { claimProfileCompleted } from '../../src/lib/xp';
import { Colors, Fonts } from '../../src/theme';

type Team = {
  idTeam: string;
  strTeam: string;
  strSport: string;
  strLeague: string;
  strCountry: string;
  strTeamBadge: string | null;
};

export default function Interests() {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { name } = useLocalSearchParams<{ name: string }>();
  const [selected, setSelected] = useState<string[]>(['football']);
  const [teamPickerVisible, setTeamPickerVisible] = useState(false);
  const [teamQuery, setTeamQuery] = useState('');
  const [teamResults, setTeamResults] = useState<Team[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(false);

  const toggleSport = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  // Debounced search
  useEffect(() => {
    if (teamQuery.trim().length < 2) {
      setTeamResults([]);
      return;
    }
    const timer = setTimeout(() => searchTeams(teamQuery.trim()), 400);
    return () => clearTimeout(timer);
  }, [teamQuery]);

  const searchTeams = async (q: string) => {
    setSearching(true);
    try {
      const res = await fetch(
        `${NEWS_API}/v1/sports/teams?t=${encodeURIComponent(q)}`
      );
      const data = await res.json();
      setTeamResults(data.teams ?? []);
    } catch {
      setTeamResults([]);
    } finally {
      setSearching(false);
    }
  };

  const pickTeam = (team: Team) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedTeam(team);
    setTeamPickerVisible(false);
  };

  const finish = async (skip = false) => {
    setLoading(true);
    if (!skip) {
      // getSession() (in-memory) instead of getUser() (network) — see register.tsx.
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { error } = await supabase.from('profiles').upsert({
          id: session.user.id,
          favourite_sport: selected[0] ?? null,
          favourite_sports: selected.join(','),
          favourite_team: selectedTeam?.strTeam ?? null,
          favourite_team_id: selectedTeam?.idTeam ?? null,
          favourite_team_sport: selectedTeam?.strSport ?? null,
          favourite_team_league: selectedTeam?.strLeague ?? null,
        });
        if (error) console.warn('interests: profile save failed:', error.message);
        // One-time +20 XP for finishing onboarding (server grants it once).
        await claimProfileCompleted();
      }
    }
    setLoading(false);
    router.push({ pathname: '/(auth)/welcome', params: { name: name ?? '', team: selectedTeam?.strTeam ?? '' } });
  };

  return (
    <ScreenBg>
      {/* Team picker modal */}
      <Modal visible={teamPickerVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
            <Text style={styles.modalTitle}>{t.interestsSearchTitle.toUpperCase()}</Text>

            <View style={styles.searchWrap}>
              <TextInput
                value={teamQuery}
                onChangeText={setTeamQuery}
                placeholder="e.g. Barcelona, Lakers, Federer..."
                placeholderTextColor={Colors.textMuted}
                style={styles.searchInput}
                autoFocus
              />
              {searching && (
                <ActivityIndicator size="small" color={Colors.primary} style={styles.searchSpinner} />
              )}
            </View>

            {teamResults.length === 0 && teamQuery.length >= 2 && !searching && (
              <Text style={styles.noResults}>{t.interestsNoTeams}</Text>
            )}

            <FlatList
              data={teamResults}
              keyExtractor={(t) => t.idTeam}
              renderItem={({ item }) => (
                <Pressable style={styles.teamRow} onPress={() => pickTeam(item)}>
                  {item.strTeamBadge ? (
                    <Image source={{ uri: item.strTeamBadge + '/tiny' }} style={styles.teamBadge} />
                  ) : (
                    <View style={[styles.teamBadge, styles.teamBadgePlaceholder]}>
                      <Text style={{ fontSize: 16 }}>🏆</Text>
                    </View>
                  )}
                  <View style={styles.teamInfo}>
                    <Text style={styles.teamName}>{item.strTeam.toUpperCase()}</Text>
                    <Text style={styles.teamMeta}>
                      {item.strSport} · {item.strLeague}
                    </Text>
                  </View>
                </Pressable>
              )}
              keyboardShouldPersistTaps="handled"
            />

            <Pressable
              style={styles.modalClose}
              onPress={() => setTeamPickerVisible(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 },
        ]}
      >
        {/* back + step progress */}
        <View style={styles.topBar}>
          <BackButton />
          <View style={styles.progress}>
            <View style={styles.progressSeg} />
            <View style={[styles.progressSeg, styles.progressActive]} />
          </View>
        </View>

        <Animated.View entering={FadeInDown.duration(600)} style={styles.headerBlock}>
          <Headline text={t.interestsHeadline} size={56} accent="last" />
          <Text style={styles.subtitle}>{t.interestsSubtitle}</Text>
        </Animated.View>

        {/* sport chips */}
        <Animated.View entering={FadeInDown.delay(120).duration(600)} style={styles.chips}>
          {sports.map((sport) => {
            const active = selected.includes(sport.id);
            return (
              <Pressable
                key={sport.id}
                onPress={() => toggleSport(sport.id)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                  {String(SPORT_KEYS[sport.id] ? t[SPORT_KEYS[sport.id]] : sport.label).toUpperCase()}
                </Text>
                <Text style={[styles.chipCheck, active && styles.chipCheckActive]}>{active ? '✓' : '+'}</Text>
              </Pressable>
            );
          })}
        </Animated.View>

        {/* favorite team */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.teamBlock}>
          <Text style={styles.fieldLabel}>{t.interestsTeamLabel}</Text>

          <Pressable
            style={[styles.teamPickerBtn, selectedTeam && styles.teamPickerBtnActive]}
            onPress={() => setTeamPickerVisible(true)}
          >
            {selectedTeam ? (
              <View style={styles.selectedTeamRow}>
                {selectedTeam.strTeamBadge ? (
                  <Image
                    source={{ uri: selectedTeam.strTeamBadge + '/tiny' }}
                    style={styles.selectedBadge}
                  />
                ) : (
                  <Text style={{ fontSize: 20 }}>🏆</Text>
                )}
                <View>
                  <Text style={styles.selectedTeamName}>{selectedTeam.strTeam.toUpperCase()}</Text>
                  <Text style={styles.selectedTeamMeta}>
                    {selectedTeam.strSport} · {selectedTeam.strLeague}
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={styles.teamPickerPlaceholder}>{t.interestsSearchPlaceholder}</Text>
            )}
            <Text style={styles.caret}>▾</Text>
          </Pressable>

          {selectedTeam && (
            <Text style={styles.teamHint}>
              {t.interestsTrack.replace('{team}', selectedTeam.strTeam)}
            </Text>
          )}
        </Animated.View>

        <View style={styles.spacer} />

        <View style={styles.ctaBlock}>
          <GlowButton label={t.interestsFinish} onPress={() => finish(false)} loading={loading} />
          <Pressable onPress={() => finish(true)} hitSlop={8} style={styles.skip}>
            <Text style={styles.skipLabel}>{t.interestsSkip}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: 16 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 20 },
  progress: { flexDirection: 'row', gap: 4 },
  progressSeg: { width: 34, height: 6, backgroundColor: Colors.line },
  progressActive: { backgroundColor: Colors.primary },
  headerBlock: { gap: 10, paddingBottom: 22 },
  subtitle: { color: Colors.textSecondary, fontSize: 15, fontFamily: Fonts.medium, lineHeight: 21 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 24 },
  chip: {
    width: '48.5%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface, paddingVertical: 13, paddingHorizontal: 12,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipLabel: { color: Colors.white, fontSize: 16, fontFamily: Fonts.label, letterSpacing: 0.4, flexShrink: 1 },
  chipLabelActive: { color: Colors.black },
  chipCheck: { color: Colors.textMuted, fontSize: 16, fontFamily: Fonts.label },
  chipCheckActive: { color: Colors.black },
  teamBlock: { gap: 8 },
  fieldLabel: { color: Colors.textMuted, fontSize: 10, fontFamily: Fonts.mono, letterSpacing: 0.9, textTransform: 'uppercase' },
  teamPickerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, paddingVertical: 14, paddingHorizontal: 14,
  },
  teamPickerBtnActive: { borderColor: Colors.primary },
  teamPickerPlaceholder: { color: Colors.textMuted, fontSize: 15, fontFamily: Fonts.medium },
  selectedTeamRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  selectedBadge: { width: 32, height: 32, resizeMode: 'contain' },
  selectedTeamName: { color: Colors.white, fontSize: 18, fontFamily: Fonts.label, letterSpacing: 0.3 },
  selectedTeamMeta: { color: Colors.textMuted, fontSize: 10, fontFamily: Fonts.mono, letterSpacing: 0.6, textTransform: 'uppercase', marginTop: 2 },
  caret: { color: Colors.primary, fontSize: 12 },
  teamHint: { color: Colors.primary, fontSize: 10, fontFamily: Fonts.mono, letterSpacing: 0.6, textTransform: 'uppercase' },
  spacer: { flex: 1, minHeight: 24 },
  ctaBlock: { gap: 12 },
  skip: { alignItems: 'center', paddingVertical: 6 },
  skipLabel: { color: Colors.textMuted, fontSize: 11, fontFamily: Fonts.mono, letterSpacing: 0.8, textTransform: 'uppercase' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: Colors.black, borderTopWidth: 3, borderTopColor: Colors.primary, paddingTop: 18, maxHeight: '85%' },
  modalTitle: { color: Colors.white, fontSize: 24, fontFamily: Fonts.display, paddingHorizontal: 20, paddingBottom: 12 },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 12,
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.primary, paddingHorizontal: 14,
  },
  searchInput: { flex: 1, color: Colors.white, fontSize: 16, fontFamily: Fonts.medium, paddingVertical: 13 },
  searchSpinner: { marginLeft: 8 },
  noResults: { color: Colors.textMuted, textAlign: 'center', fontFamily: Fonts.medium, fontSize: 14, paddingVertical: 20 },
  teamRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: Colors.line,
  },
  teamBadge: { width: 36, height: 36, resizeMode: 'contain' },
  teamBadgePlaceholder: { backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center' },
  teamInfo: { flex: 1 },
  teamName: { color: Colors.white, fontSize: 17, fontFamily: Fonts.label, letterSpacing: 0.3 },
  teamMeta: { color: Colors.textMuted, fontSize: 10, fontFamily: Fonts.mono, letterSpacing: 0.6, textTransform: 'uppercase', marginTop: 3 },
  modalClose: { alignItems: 'center', paddingVertical: 16 },
  modalCloseText: { color: Colors.textMuted, fontSize: 11, fontFamily: Fonts.mono, letterSpacing: 0.8, textTransform: 'uppercase' },
});
