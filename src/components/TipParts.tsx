// Small building blocks shared by the Tippspiel screens.
import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { LangCode } from '../lib/i18n';
import type { Competition, Round } from '../lib/tippspiel';
import { Colors, Fonts, Typography } from '../theme';

export const LOCALE: Record<LangCode, string> = {
  en: 'en-GB', de: 'de-DE', es: 'es-ES', pt: 'pt-PT', fr: 'fr-FR', it: 'it-IT', ro: 'ro-RO',
};

/** Fill "{name}, …" templates; without a name the greeting part is dropped. */
export function fillText(s: string, vars: Record<string, string | number>): string {
  const out = Object.entries(vars).reduce(
    (acc, [k, v]) => (k === 'name' && v === '' ? acc.replace(/\{name\}[,!]?\s*/, '') : acc.replace(`{${k}}`, String(v))),
    s,
  );
  return out.charAt(0).toUpperCase() + out.slice(1);
}

/** Team crest (PNG from football-data.org), initials when there is none. */
export function Crest({ uri, name, size = 26 }: { uri: string | null; name: string; size?: number }) {
  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size }} resizeMode="contain" />;
  }
  const initials = name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <View style={[styles.initials, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.initialsText, { fontSize: size * 0.38 }]}>{initials}</Text>
    </View>
  );
}

const BADGE: Record<number, { bg: string; border: string; text: string }> = {
  3: { bg: Colors.glowGold, border: Colors.gold, text: Colors.gold },
  2: { bg: Colors.glowGreen, border: Colors.primary, text: Colors.primary },
  1: { bg: Colors.glowPurple, border: Colors.accentLight, text: Colors.accentLight },
  0: { bg: Colors.glass, border: Colors.glassBorder, text: Colors.textMuted },
};

/** "+3" / "+2" / "+1" / "0" pill for a scored tip (bonus answers: +10 / +5 in gold). */
export function PointsBadge({ points }: { points: number }) {
  const c = BADGE[Math.min(Math.max(points, 0), 3)];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg, borderColor: c.border }]}>
      <Text style={[styles.badgeText, { color: c.text }]}>{points > 0 ? `+${points}` : '0'}</Text>
    </View>
  );
}

/** Horizontal competition picker; `allLabel` adds an "all competitions" chip. */
export function CompetitionChips({
  competitions, value, onChange, allLabel,
}: {
  competitions: Competition[];
  value: string | null;
  onChange: (code: string | null) => void;
  allLabel?: string;
}) {
  const chips: { code: string | null; name: string; emblem: string | null }[] = [
    ...(allLabel ? [{ code: null, name: allLabel, emblem: null }] : []),
    ...competitions.map((c) => ({ code: c.code, name: c.name, emblem: c.emblem })),
  ];
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
      {chips.map((c) => {
        const active = c.code === value;
        return (
          <Pressable
            key={c.code ?? 'all'}
            onPress={() => {
              Haptics.selectionAsync();
              onChange(c.code);
            }}
            style={[styles.chip, active && styles.chipActive]}
          >
            {c.emblem && <Image source={{ uri: c.emblem }} style={styles.chipEmblem} resizeMode="contain" />}
            <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{c.name}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

type StageLabels = {
  tipMatchday: string; tipStagePlayoffs: string; tipStageLast16: string;
  tipStageQuarter: string; tipStageSemi: string; tipStageFinal: string;
};

/** "Matchday 8", "Round of 16", … */
export function roundLabel(round: Pick<Round, 'matchday' | 'stage'>, t: StageLabels): string {
  switch (round.stage) {
    case 'PLAYOFFS': return t.tipStagePlayoffs;
    case 'LAST_16': return t.tipStageLast16;
    case 'QUARTER_FINALS': return t.tipStageQuarter;
    case 'SEMI_FINALS': return t.tipStageSemi;
    case 'FINAL': return t.tipStageFinal;
    default: return round.matchday != null ? `${t.tipMatchday} ${round.matchday}` : t.tipMatchday;
  }
}

const styles = StyleSheet.create({
  initials: {
    backgroundColor: Colors.cardElevated, borderWidth: 1, borderColor: Colors.glassBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  initialsText: { color: Colors.textSecondary, fontFamily: Fonts.bold },
  badge: {
    minWidth: 34, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 999, borderWidth: 1, alignItems: 'center',
  },
  badgeText: { fontSize: Typography.xs + 1, fontFamily: Fonts.extrabold },
  chips: { gap: 8, paddingVertical: 2 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 999, backgroundColor: Colors.glass,
    borderWidth: 1, borderColor: Colors.glassBorder,
  },
  chipActive: { backgroundColor: Colors.glowGreen, borderColor: Colors.primary },
  chipEmblem: { width: 18, height: 18 },
  chipLabel: { color: Colors.textSecondary, fontSize: Typography.sm, fontFamily: Fonts.semibold },
  chipLabelActive: { color: Colors.textPrimary },
});
