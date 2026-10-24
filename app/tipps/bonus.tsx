import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import BackButton from '../../src/components/BackButton';
import GlowCard from '../../src/components/GlowCard';
import ScreenBg from '../../src/components/ScreenBg';
import { Headline } from '../../src/components/Urban';
import { CompetitionChips, Crest, LOCALE, PointsBadge, fillText } from '../../src/components/TipParts';
import { useI18n } from '../../src/lib/i18n';
import {
  BonusAnswer, BonusQuestion, Competition, Team,
  defaultCompetition, fetchBonus, fetchCompetitions, fetchMatches, placeBonusTip, teamsOf,
} from '../../src/lib/tippspiel';
import { Colors, Fonts, Spacing, Typography } from '../../src/theme';

export default function BonusScreen() {
  const { t, lang } = useI18n();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ competition?: string }>();

  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [comp, setComp] = useState<string>(params.competition ?? defaultCompetition(lang));
  const [questions, setQuestions] = useState<BonusQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, BonusAnswer>>({});
  const [teams, setTeams] = useState<Team[]>([]);
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchCompetitions().then(setCompetitions); }, []);

  const load = useCallback(async () => {
    const c = competitions.find((x) => x.code === comp);
    if (!c?.current_season) { setQuestions([]); setLoading(false); return; }
    const [bonus, matches] = await Promise.all([fetchBonus(c.code, c.current_season), fetchMatches(c.code, c.current_season)]);
    setQuestions(bonus.questions);
    setAnswers(bonus.answers);
    setTeams(teamsOf(matches));
    setLoading(false);
  }, [comp, competitions]);

  useEffect(() => {
    if (competitions.length === 0) return;
    setLoading(true);
    setOpenQuestion(null);
    load();
  }, [load, competitions.length]);

  const pick = async (q: BonusQuestion, team: Team) => {
    Haptics.selectionAsync();
    setError(null);
    const prev = answers[q.id];
    setAnswers((a) => ({ ...a, [q.id]: { question_id: q.id, team_id: team.id, points: null } }));
    const res = await placeBonusTip(q.id, team.id);
    if (!res.ok) {
      setAnswers((a) => {
        const next = { ...a };
        if (prev) next[q.id] = prev; else delete next[q.id];
        return next;
      });
      setError(res.error === 'tip_closed' ? t.tipBonusClosed : t.tipError);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setOpenQuestion(null);
  };

  const dateFmt = new Intl.DateTimeFormat(LOCALE[lang], { day: 'numeric', month: 'long' });
  const questionText = (q: BonusQuestion) =>
    q.kind === 'last_place' ? t.tipBonusLastPlace : q.competition === 'CL' ? t.tipBonusCupWinner : t.tipBonusChampion;
  const teamById = (id: number | null | undefined) => teams.find((x) => x.id === id) ?? null;

  return (
    <ScreenBg>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <BackButton />
          <Headline text={t.tipBonusTitle} size={34} accent="last" />
        </View>

        <CompetitionChips competitions={competitions} value={comp} onChange={(c) => c && setComp(c)} />

        {error && <Text style={styles.error}>{error}</Text>}

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 24 }} />
        ) : questions.length === 0 ? (
          <GlowCard style={styles.emptyCard}>
            <Text style={styles.emptyText}>{fillText(t.tipWarmingUp, { name: '' })}</Text>
          </GlowCard>
        ) : (
          questions.map((q, i) => {
            const answer = answers[q.id];
            const chosen = teamById(answer?.team_id);
            const closed = Date.parse(q.closes_at) <= Date.now() || q.answer_team_id != null;
            const expanded = openQuestion === q.id && !closed;
            const correct = teamById(q.answer_team_id);
            return (
              <Animated.View key={q.id} entering={FadeInDown.delay(i * 60).duration(400)}>
                <GlowCard variant={q.kind === 'champion' ? 'gold' : 'accent'} style={styles.qCard}>
                  <View style={styles.qHead}>
                    <Text style={styles.qText}>{questionText(q)}</Text>
                    {answer?.points != null ? <PointsBadge points={answer.points} /> : (
                      <Text style={styles.qPoints}>+{q.points} {t.tipPts}</Text>
                    )}
                  </View>
                  <Text style={styles.qMeta}>
                    {closed ? t.tipBonusClosed : `${t.tipBonusOpenUntil} ${dateFmt.format(new Date(q.closes_at))}`}
                  </Text>

                  <Pressable
                    disabled={closed}
                    onPress={() => { Haptics.selectionAsync(); setOpenQuestion(expanded ? null : q.id); }}
                    style={[styles.choice, chosen && styles.choiceSet]}
                  >
                    {chosen ? <Crest uri={chosen.crest} name={chosen.name} size={28} /> : <Text style={styles.choiceEmoji}>?</Text>}
                    <Text style={[styles.choiceText, !chosen && styles.choicePlaceholder]}>
                      {chosen ? chosen.name : t.tipBonusPick}
                    </Text>
                    {!closed && <Text style={styles.choiceChevron}>{expanded ? '−' : '+'}</Text>}
                  </Pressable>

                  {correct && (
                    <Text style={styles.qMeta}>✓ {correct.name}</Text>
                  )}

                  {expanded && (
                    <View style={styles.grid}>
                      {teams.map((team) => {
                        const active = team.id === answer?.team_id;
                        return (
                          <Pressable
                            key={team.id}
                            onPress={() => pick(q, team)}
                            style={({ pressed }) => [styles.team, active && styles.teamActive, pressed && styles.teamPressed]}
                          >
                            <Crest uri={team.crest} name={team.name} size={30} />
                            <Text style={styles.teamName} numberOfLines={1}>{team.name}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                </GlowCard>
              </Animated.View>
            );
          })
        )}
      </ScrollView>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: Spacing.lg, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  error: { color: Colors.danger, fontSize: Typography.sm, fontFamily: Fonts.semibold, textAlign: 'center' },
  qCard: { padding: 16, gap: 10 },
  qHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  qText: { flex: 1, color: Colors.white, fontSize: 24, lineHeight: 26, fontFamily: Fonts.display, textTransform: 'uppercase' },
  qPoints: { color: Colors.primary, fontSize: 18, fontFamily: Fonts.display },
  qMeta: { color: Colors.textMuted, fontSize: 11, fontFamily: Fonts.mono, letterSpacing: 0.8, textTransform: 'uppercase' },
  choice: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 0,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.glassBorder,
  },
  choiceSet: { borderColor: Colors.primary },
  choiceEmoji: { color: Colors.primary, fontSize: 24, fontFamily: Fonts.display, width: 28, textAlign: 'center' },
  choiceText: { flex: 1, color: Colors.white, fontSize: 18, fontFamily: Fonts.label, textTransform: 'uppercase', letterSpacing: 0.4 },
  choicePlaceholder: { color: Colors.textSecondary, fontFamily: Fonts.semibold },
  choiceChevron: { color: Colors.primary, fontSize: 20, fontFamily: Fonts.label },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  team: {
    width: '31.5%', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 4,
    borderRadius: 0, backgroundColor: Colors.glass, borderWidth: 1, borderColor: Colors.glassBorder,
  },
  teamActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  teamPressed: { opacity: 0.7 },
  teamName: { color: Colors.white, fontSize: 13, fontFamily: Fonts.label, textTransform: 'uppercase', letterSpacing: 0.4, textAlign: 'center' },
  emptyCard: { padding: 20, alignItems: 'center' },
  emptyText: { color: Colors.textSecondary, fontSize: Typography.sm, fontFamily: Fonts.medium, textAlign: 'center' },
});
