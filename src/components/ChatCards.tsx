import React from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import { Blink, Meta } from './Urban';
import { ChatCard } from '../lib/chatCards';
import { useI18n } from '../lib/i18n';
import { formatKickoff } from '../lib/sports';
import { Colors, Fonts, displayType } from '../theme';

type MatchCard = Extract<ChatCard, { type: 'match' }>;

const LIVE = /^(1H|2H|HT|ET|BT|P|LIVE|IN PLAY)$/i;
const FINAL = /^(FT|AET|PEN|AP|MATCH FINISHED)$/i;

/** Kickoff in the player's own time zone, with today / tomorrow labels. */
function kickoffLabel(iso: string, lang: string, labels: { today: string; tomorrow: string }) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return formatKickoff(`${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`, `${p(d.getHours())}:${p(d.getMinutes())}:00`, lang, labels);
}

function Crest({ uri }: { uri: string | null }) {
  return uri
    ? <Image source={{ uri }} style={styles.crest} resizeMode="contain" />
    : <View style={[styles.crest, styles.crestEmpty]} />;
}

function Match({ card }: { card: MatchCard }) {
  const { t, lang } = useI18n();
  const hasScore = card.homeScore != null && card.awayScore != null && card.homeScore !== '' && card.awayScore !== '';
  const live = !!card.status && LIVE.test(card.status);
  const final = hasScore && !live && (!card.status || FINAL.test(card.status) || !/^(NS|TBD)$/i.test(card.status));
  const when = card.kickoff ? kickoffLabel(card.kickoff, lang, { today: t.homeToday, tomorrow: t.homeTomorrow }) : '';
  const state = live ? 'LIVE' : final ? t.chatCardFinal : when;

  return (
    <View style={styles.card}>
      <View style={styles.matchHead}>
        <Meta numberOfLines={1} style={styles.flexShrink}>{card.league ?? ''}</Meta>
        <View style={styles.state}>
          {live && <Blink size={6} />}
          <Meta color={live ? Colors.live : Colors.primary}>{state}</Meta>
        </View>
      </View>
      {[
        { name: card.home, badge: card.homeBadge, score: card.homeScore },
        { name: card.away, badge: card.awayBadge, score: card.awayScore },
      ].map((side) => (
        <View key={side.name} style={styles.side}>
          <Crest uri={side.badge} />
          <Text style={styles.team} numberOfLines={1}>{side.name.toUpperCase()}</Text>
          {hasScore && <Text style={styles.score}>{side.score}</Text>}
        </View>
      ))}
      {card.video && (
        <Pressable
          onPress={() => { Haptics.selectionAsync(); Linking.openURL(card.video!); }}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        >
          <Text style={styles.actionText}>{`▶  ${t.chatCardHighlights.toUpperCase()}`}</Text>
        </Pressable>
      )}
    </View>
  );
}

function News({ card }: { card: Extract<ChatCard, { type: 'news' }> }) {
  const { t } = useI18n();
  const router = useRouter();
  return (
    <Pressable
      onPress={() => { Haptics.selectionAsync(); router.push({ pathname: '/article', params: { id: String(card.id) } }); }}
      style={({ pressed }) => [styles.card, styles.noPad, pressed && styles.pressed]}
    >
      {card.image && <Image source={{ uri: card.image }} style={styles.newsImage} resizeMode="cover" />}
      <View style={styles.newsBody}>
        {!!card.kicker && <Meta color={Colors.primary} numberOfLines={1}>{card.kicker}</Meta>}
        <Text style={styles.newsHeadline} numberOfLines={3}>{card.headline.toUpperCase()}</Text>
        <Text style={styles.more}>{`${t.chatCardRead.toUpperCase()} →`}</Text>
      </View>
    </Pressable>
  );
}

function Link({ card }: { card: Extract<ChatCard, { type: 'link' }> }) {
  const { t } = useI18n();
  return (
    <Pressable
      onPress={() => { Haptics.selectionAsync(); WebBrowser.openBrowserAsync(card.url); }}
      style={({ pressed }) => [styles.card, styles.linkRow, pressed && styles.pressed]}
    >
      {card.image && <Image source={{ uri: card.image }} style={styles.linkImage} resizeMode="cover" />}
      <View style={styles.linkBody}>
        <Meta numberOfLines={1}>{card.site}</Meta>
        <Text style={styles.linkTitle} numberOfLines={3}>{card.title}</Text>
        <Text style={styles.more}>{`${t.chatCardOpen.toUpperCase()} ↗`}</Text>
      </View>
    </Pressable>
  );
}

function Tippspiel({ card }: { card: Extract<ChatCard, { type: 'tippspiel' }> }) {
  const { t, lang } = useI18n();
  const router = useRouter();
  const when = card.nextKickoff ? kickoffLabel(card.nextKickoff, lang, { today: t.homeToday, tomorrow: t.homeTomorrow }) : '';
  return (
    <Pressable
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/(tabs)/tippspiel'); }}
      style={({ pressed }) => [styles.tip, pressed && styles.pressed]}
    >
      <Meta color={Colors.black}>BEAT BETINA</Meta>
      <View style={styles.tipRow}>
        {card.open > 0 && <Text style={styles.tipNumber}>{card.open}</Text>}
        <Text style={styles.tipTitle} numberOfLines={2}>
          {(card.open > 0 ? t.chatCardTipOpen.replace('{n}', '').trim() : t.chatCardTipDone).toUpperCase()}
        </Text>
      </View>
      {card.next && <Meta color={Colors.black} numberOfLines={1}>{`${card.next}${when ? ` · ${when}` : ''}`}</Meta>}
      <View style={styles.tipButton}>
        <Text style={styles.tipButtonText}>{t.chatCardTipCta.toUpperCase()}</Text>
        <Text style={styles.tipButtonText}>→</Text>
      </View>
    </Pressable>
  );
}

/** The cards under one of BETina's messages. */
export default function ChatCards({ cards }: { cards: ChatCard[] }) {
  if (!cards.length) return null;
  return (
    <View style={styles.list}>
      {cards.map((card, i) => {
        const key = `${card.type}-${i}`;
        if (card.type === 'match') return <Match key={key} card={card} />;
        if (card.type === 'news') return <News key={key} card={card} />;
        if (card.type === 'link') return <Link key={key} card={card} />;
        return <Tippspiel key={key} card={card} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 8, width: '86%', maxWidth: 380 },
  card: { backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.border, padding: 12, gap: 8 },
  noPad: { padding: 0, gap: 0 },
  pressed: { borderColor: Colors.primary, opacity: 0.9 },
  flexShrink: { flexShrink: 1 },

  matchHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  state: { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 0 },
  side: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  crest: { width: 28, height: 28 },
  crestEmpty: { backgroundColor: Colors.cardElevated },
  team: { flex: 1, color: Colors.white, fontSize: 17, fontFamily: Fonts.label, letterSpacing: 0.4 },
  score: { ...displayType(26, 30), color: Colors.white, minWidth: 22, textAlign: 'right' },
  action: { marginTop: 2, backgroundColor: Colors.primary, paddingVertical: 10, alignItems: 'center' },
  actionText: { color: Colors.black, fontSize: 15, fontFamily: Fonts.label, letterSpacing: 0.6 },

  newsImage: { width: '100%', height: 150 },
  newsBody: { padding: 12, gap: 6 },
  newsHeadline: { ...displayType(21, 24), color: Colors.white },
  more: { color: Colors.primary, fontSize: 13, fontFamily: Fonts.label, letterSpacing: 0.5 },

  linkRow: { flexDirection: 'row', gap: 12 },
  linkImage: { width: 76, height: 76 },
  linkBody: { flex: 1, gap: 4 },
  linkTitle: { color: Colors.white, fontSize: 14, lineHeight: 19, fontFamily: Fonts.semibold },

  tip: { backgroundColor: Colors.primary, padding: 12, gap: 6 },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tipNumber: { ...displayType(52, 56), color: Colors.black },
  tipTitle: { ...displayType(22, 24), flex: 1, color: Colors.black },
  tipButton: {
    marginTop: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.black, paddingHorizontal: 12, paddingVertical: 10,
  },
  tipButtonText: { color: Colors.primary, fontSize: 16, fontFamily: Fonts.label, letterSpacing: 0.6 },
});
