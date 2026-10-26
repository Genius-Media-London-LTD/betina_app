// Small building blocks shared by the Tippspiel screens.
import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import HScroll from './HScroll';
import * as Haptics from 'expo-haptics';
import type { LangCode } from '../lib/i18n';
import type { Competition, Round } from '../lib/tippspiel';
import { Colors, Fonts } from '../theme';

export const LOCALE: Record<LangCode, string> = {
  en: 'en-GB', de: 'de-DE', es: 'es-ES', pt: 'pt-PT', fr: 'fr-FR', it: 'it-IT', ro: 'ro-RO', tr: 'tr-TR', hr: 'hr-HR',
};

/** Fill "{name}, …" templates; without a name the greeting part is dropped. */
export function fillText(s: string, vars: Record<string, string | number>): string {
  const dropName = vars.name === '' && s.startsWith('{name}');
  const out = Object.entries(vars).reduce(
    (acc, [k, v]) => (k === 'name' && v === '' ? acc.replace(/\{name\}[,!]?\s*/, '') : acc.replace(`{${k}}`, String(v))),
    s,
  );
  // "{name}, the fixtures…" without a name → "The fixtures…"
  return dropName ? out.charAt(0).toUpperCase() + out.slice(1) : out;
}

/** Competition logo on a light tile: several (Premier League, Champions League) are dark artwork. */
export function Emblem({ uri, size = 28 }: { uri: string | null; size?: number }) {
  return (
    <View style={[styles.emblemTile, { width: size + 8, height: size + 8 }]}>
      {uri ? <Image source={{ uri }} style={{ width: size, height: size }} resizeMode="contain" /> : <Text style={{ fontSize: size * 0.6 }}>🏆</Text>}
    </View>
  );
}

/** Team crest (PNG from football-data.org), initials when there is none. */
export function Crest({ uri, name, size = 26 }: { uri: string | null; name: string; size?: number }) {
  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size }} resizeMode="contain" />;
  }
  const initials = name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <View style={[styles.initials, { width: size, height: size }]}>
      <Text style={[styles.initialsText, { fontSize: size * 0.38 }]}>{initials}</Text>
    </View>
  );
}

// Exact hit = lime block, right difference = lime outline, right outcome = white outline.
const BADGE: Record<number, { bg: string; border: string; text: string }> = {
  3: { bg: Colors.primary, border: Colors.primary, text: Colors.black },
  2: { bg: 'transparent', border: Colors.primary, text: Colors.primary },
  1: { bg: 'transparent', border: Colors.white, text: Colors.white },
  0: { bg: 'transparent', border: Colors.borderStrong, text: Colors.textMuted },
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
    <HScroll contentContainerStyle={styles.chips}>
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
            {c.emblem && <Emblem uri={c.emblem} size={14} />}
            <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{c.name.toUpperCase()}</Text>
          </Pressable>
        );
      })}
    </HScroll>
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
    backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  initialsText: { color: Colors.textSecondary, fontFamily: Fonts.label },
  badge: { minWidth: 34, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1.5, alignItems: 'center' },
  badgeText: { fontSize: 16, fontFamily: Fonts.display },
  chips: { gap: 6, paddingVertical: 2 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1.5, borderColor: Colors.borderStrong,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  emblemTile: { backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  chipLabel: { color: Colors.textSecondary, fontSize: 14, fontFamily: Fonts.label, letterSpacing: 0.5 },
  chipLabelActive: { color: Colors.black },
});
