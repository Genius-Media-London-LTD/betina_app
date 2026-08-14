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
import { sports } from '../../src/lib/demo';
import { SPORT_KEYS, useI18n } from '../../src/lib/i18n';
import { supabase } from '../../src/lib/supabase';
import { claimProfileCompleted } from '../../src/lib/xp';
import { Colors, Fonts, Spacing, Typography } from '../../src/theme';

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
        `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(q)}`
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
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          favourite_sport: selected[0] ?? null,
          favourite_sports: selected.join(','),
          favourite_team: selectedTeam?.strTeam ?? null,
          favourite_team_id: selectedTeam?.idTeam ?? null,
          favourite_team_sport: selectedTeam?.strSport ?? null,
          favourite_team_league: selectedTeam?.strLeague ?? null,
        });
        // One-time +20 XP for finishing onboarding (server grants it once).
        await claimProfileCompleted();
      }
    }
    setLoading(false);
    router.push({ pathname: '/(auth)/welcome', params: { name: name ?? '', team: selectedTeam?.strTeam ?? '' } });
  };

  return (
    <ScreenBg glowTop={0.14} glowSize={420}>
      {/* Team picker modal */}
      <Modal visible={teamPickerVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
            <Text style={styles.modalTitle}>{t.interestsSearchTitle}</Text>

            <View style={styles.searchWrap}>
              <TextInput
                value={teamQuery}
                onChangeText={setTeamQuery}
                placeholder="e.g. Barcelona, Lakers, Federer..."
                placeholderTextColor="#55556A"
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
                    <Text style={styles.teamName}>{item.strTeam}</Text>
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
          { paddingTop: insets.top + Spacing.base, paddingBottom: insets.bottom + Spacing['2xl'] },
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
          <Text style={styles.title}>{t.interestsTitle}</Text>
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
                  {sport.emoji} {SPORT_KEYS[sport.id] ? t[SPORT_KEYS[sport.id]] : sport.label}
                </Text>
                {active && <Text style={styles.chipCheck}>✓</Text>}
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
                  <Text style={styles.selectedTeamName}>{selectedTeam.strTeam}</Text>
                  <Text style={styles.selectedTeamMeta}>
                    {selectedTeam.strSport} · {selectedTeam.strLeague}
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={styles.teamPickerPlaceholder}>🔍  {t.interestsSearchPlaceholder}</Text>
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
  content: { flexGrow: 1, paddingHorizontal: Spacing.xl },
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingVertical: Spacing.lg,
  },
  progress: { flexDirection: 'row', gap: 6 },
  progressSeg: {
    width: 22, height: 4, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  progressActive: { backgroundColor: Colors.primary },
  headerBlock: { gap: Spacing.sm, paddingBottom: 26 },
  title: { color: '#FFFFFF', fontSize: 26, fontFamily: Fonts.bold },
  subtitle: {
    color: Colors.textSecondary, fontSize: Typography.sm + 1,
    fontFamily: Fonts.medium, lineHeight: 21,
  },
  chips: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: Spacing.sm + 2, paddingBottom: 28,
  },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.glass, borderWidth: 1, borderColor: Colors.glassBorder,
    borderRadius: 999, paddingVertical: 11, paddingHorizontal: 18,
  },
  chipActive: { backgroundColor: 'rgba(184,233,38,0.14)', borderColor: 'rgba(184,233,38,0.6)' },
  chipLabel: { color: Colors.textSecondary, fontSize: Typography.sm + 1, fontFamily: Fonts.semibold },
  chipLabelActive: { color: '#FFFFFF' },
  chipCheck: { color: Colors.primary, fontSize: Typography.sm + 1 },
  teamBlock: { gap: Spacing.sm + 2 },
  fieldLabel: {
    color: Colors.textSecondary, fontSize: Typography.xs + 1,
    fontFamily: Fonts.semibold, letterSpacing: 1.2, textTransform: 'uppercase',
  },
  teamPickerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.glass, borderWidth: 1, borderColor: Colors.glassBorder,
    borderRadius: 20, paddingVertical: 16, paddingHorizontal: 18,
  },
  teamPickerBtnActive: { borderColor: 'rgba(184,233,38,0.45)' },
  teamPickerPlaceholder: {
    color: '#55556A', fontSize: Typography.sm + 1, fontFamily: Fonts.medium,
  },
  selectedTeamRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  selectedBadge: { width: 32, height: 32, resizeMode: 'contain' },
  selectedTeamName: { color: '#FFFFFF', fontSize: Typography.md - 1, fontFamily: Fonts.semibold },
  selectedTeamMeta: { color: Colors.textSecondary, fontSize: Typography.xs + 1, fontFamily: Fonts.medium },
  caret: { color: '#55556A', fontSize: 12 },
  teamHint: { color: '#55556A', fontSize: Typography.xs + 1, fontFamily: Fonts.medium },
  spacer: { flex: 1, minHeight: Spacing.xl },
  ctaBlock: { gap: Spacing.base - 2 },
  skip: { alignItems: 'center' },
  skipLabel: { color: '#55556A', fontSize: Typography.sm, fontFamily: Fonts.medium },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#16162A', borderTopLeftRadius: 28,
    borderTopRightRadius: 28, paddingTop: 20, maxHeight: '85%',
  },
  modalTitle: {
    color: '#FFFFFF', fontSize: Typography.base, fontFamily: Fonts.bold,
    textAlign: 'center', paddingBottom: 14,
  },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 20, marginBottom: 12,
    backgroundColor: Colors.glass, borderWidth: 1,
    borderColor: 'rgba(184,233,38,0.4)', borderRadius: 16,
    paddingHorizontal: 16,
  },
  searchInput: {
    flex: 1, color: '#FFFFFF', fontSize: Typography.base - 1,
    fontFamily: Fonts.medium, paddingVertical: 14,
  },
  searchSpinner: { marginLeft: 8 },
  noResults: {
    color: '#55556A', textAlign: 'center',
    fontFamily: Fonts.medium, fontSize: Typography.sm, paddingVertical: 20,
  },
  teamRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 14, paddingVertical: 12, paddingHorizontal: 20,
  },
  teamBadge: { width: 36, height: 36, resizeMode: 'contain' },
  teamBadgePlaceholder: {
    backgroundColor: Colors.glass, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  teamInfo: { flex: 1 },
  teamName: { color: '#FFFFFF', fontSize: Typography.base - 1, fontFamily: Fonts.semibold },
  teamMeta: { color: Colors.textSecondary, fontSize: Typography.xs + 1, fontFamily: Fonts.medium, marginTop: 2 },
  modalClose: { alignItems: 'center', paddingVertical: 16 },
  modalCloseText: { color: '#55556A', fontSize: Typography.sm, fontFamily: Fonts.medium },
});
