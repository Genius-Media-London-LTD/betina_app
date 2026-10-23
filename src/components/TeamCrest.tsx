import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { fetchTeamBadge } from '../lib/sports';
import { Colors, Fonts, withAlpha } from '../theme';

type Props = {
  teamId?: string | null;
  teamName?: string | null;
  size?: number;
};

/** Renders a team's real crest (TheSportsDB), falling back to initials. */
export default function TeamCrest({ teamId, teamName, size = 28 }: Props) {
  const [badge, setBadge] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!teamId) { setBadge(null); return; }
    fetchTeamBadge(teamId).then((url) => { if (active) setBadge(url); });
    return () => { active = false; };
  }, [teamId]);

  if (badge) {
    return (
      <Image
        source={{ uri: `${badge}/tiny` }}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    );
  }

  // Fallback: initials in a neutral circle (never a wrong crest)
  const initials = (teamName ?? '?')
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 3)
    .join('')
    .toUpperCase();

  return (
    <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.initials, { fontSize: size * 0.34 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: withAlpha(Colors.white, 0.08),
    borderWidth: 1,
    borderColor: withAlpha(Colors.white, 0.15),
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: Colors.textSecondary,
    fontFamily: Fonts.bold,
  },
});
