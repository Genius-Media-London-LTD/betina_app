// Team dashboard: how BETina is doing — players, sign-ups, activity, what
// players write — and BETina's posts on X (review, approve, kill switch).
// Only for accounts in public.admins (migrations 024, 025); the server checks
// every call. Internal tool, so the copy is English only.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AnimatedNumber from '../src/components/AnimatedNumber';
import BackButton from '../src/components/BackButton';
import { Meta } from '../src/components/Urban';
import {
  AdminMessage, AdminUser, Count, Overview, SocialMode, SocialPost, SocialState, SocialStatus,
  decideSocial, fetchAdminMessages, socialCardUrl, fetchAdminUsers, fetchOverview, fetchSocial, setSocialMode, useIsAdmin,
} from '../src/lib/admin';
import { isDesktopWidth } from '../src/lib/layout';
import { Colors, Fonts, displayType } from '../src/theme';

type Tab = 'overview' | 'players' | 'chats' | 'social';
type Picked = { id: string; name: string };

const LOCALE = 'de-AT';
const dateShort = (iso: string) => new Date(iso).toLocaleDateString(LOCALE, { day: '2-digit', month: '2-digit' });
const dateTime = (iso: string) => new Date(iso).toLocaleString(LOCALE, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
function ago(iso: string | null) {
  if (!iso) return '—';
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m} min`;
  if (m < 48 * 60) return `${Math.round(m / 60)} h`;
  return `${Math.round(m / 1440)} d`;
}

export default function AdminScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const desktop = isDesktopWidth(width);
  const admin = useIsAdmin();
  const [tab, setTab] = useState<Tab>('overview');
  const [picked, setPicked] = useState<Picked | null>(null);

  if (admin === undefined) {
    return <View style={[styles.root, styles.center]}><ActivityIndicator color={Colors.primary} /></View>;
  }
  if (!admin) {
    return (
      <View style={[styles.root, styles.center, { padding: 24 }]}>
        <Text style={styles.denyTitle}>NO ACCESS.</Text>
        <Text style={styles.denyText}>This dashboard is for the BETina team. Sign in with an admin account.</Text>
        <Pressable onPress={() => router.replace('/')} style={styles.denyBtn}><Text style={styles.denyBtnText}>BACK TO BETINA →</Text></Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.row}>
        <ScrollView style={{ flex: 1, minWidth: 0 }} contentContainerStyle={[styles.content, desktop && styles.contentDesktop, { paddingBottom: insets.bottom + 40 }]}>
          <View style={styles.head}>
            <BackButton onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
            <View style={{ flex: 1 }}>
              <Meta color={Colors.primary}>// BETINA · TEAM</Meta>
              <Text style={styles.title}>DASHBOARD.</Text>
            </View>
          </View>

          <View style={styles.tabs}>
            {(['overview', 'players', 'chats', 'social'] as Tab[]).map((k) => (
              <Pressable key={k} onPress={() => setTab(k)} style={[styles.tab, tab === k && styles.tabOn]}>
                <Text style={[styles.tabText, tab === k && styles.tabTextOn]}>{k.toUpperCase()}</Text>
              </Pressable>
            ))}
          </View>

          {tab === 'overview' && <OverviewTab desktop={desktop} onPick={setPicked} />}
          {tab === 'players' && <PlayersTab desktop={desktop} onPick={setPicked} />}
          {tab === 'chats' && <ChatsTab onPick={setPicked} />}
          {tab === 'social' && <SocialTab desktop={desktop} />}
        </ScrollView>

        {desktop && picked && (
          <View style={styles.panel}><Conversation user={picked} onClose={() => setPicked(null)} /></View>
        )}
      </View>

      {!desktop && (
        <Modal visible={!!picked} animationType="slide" onRequestClose={() => setPicked(null)}>
          <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            {picked && <Conversation user={picked} onClose={() => setPicked(null)} />}
          </View>
        </Modal>
      )}
    </View>
  );
}

// ── Overview ─────────────────────────────────────────────────────────────────
function OverviewTab({ desktop, onPick }: { desktop: boolean; onPick: (p: Picked) => void }) {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    fetchOverview(days).then(setData).catch((e) => setError(String(e?.message ?? e)));
  }, [days]);
  useEffect(() => { load(); }, [load]);

  if (error) return <ErrorBox text={error} onRetry={load} />;
  if (!data) return <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />;
  const t = data.totals;
  const tile = desktop ? styles.tileDesktop : styles.tilePhone;

  const kpis: { label: string; value: number; sub: string; hot?: boolean }[] = [
    { label: 'Players', value: t.users, sub: `${t.registered} with profile`, hot: true },
    { label: 'New today', value: t.signups_today, sub: `${t.signups_7d} in 7 days` },
    { label: 'Chatting · 7d', value: t.active_7d, sub: `${t.active_today} today` },
    { label: 'Opened app · 7d', value: t.opened_7d, sub: `${t.opened_today} today` },
    { label: 'Messages', value: t.messages, sub: `${t.messages_today} today · ${t.chatters} players` },
    { label: 'Push on', value: t.push, sub: `${pct(t.push, t.users)} of players` },
    { label: 'Predictions', value: t.tips, sub: `${t.tippers} players · ${t.tip_groups} leagues` },
    { label: 'GeniusBet linked', value: t.crm_matched, sub: `${pct(t.crm_matched, t.users)} of players` },
    { label: 'Live follows', value: t.follows, sub: 'teams & matches' },
    { label: 'BETina memories', value: t.memories, sub: `${t.reminders_open} reminders open` },
    { label: 'News today', value: t.news_today, sub: 'articles written' },
    { label: 'XP total', value: t.xp_total, sub: 'all players' },
  ];

  return (
    <View style={{ gap: 18 }}>
      <View style={styles.periodRow}>
        <Meta>{`UPDATED ${dateTime(data.generated_at)}`}</Meta>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {[7, 30, 90].map((d) => (
            <Pressable key={d} onPress={() => setDays(d)} style={[styles.chip, days === d && styles.chipOn]}>
              <Text style={[styles.chipText, days === d && styles.chipTextOn]}>{d} DAYS</Text>
            </Pressable>
          ))}
          <Pressable onPress={load} style={styles.chip}><Text style={styles.chipText}>↻</Text></Pressable>
        </View>
      </View>

      <View style={styles.grid}>
        {kpis.map((k) => (
          <View key={k.label} style={[styles.tile, tile, k.hot && styles.tileHot]}>
            <Text style={[styles.tileLabel, k.hot && { color: Colors.black }]}>{k.label.toUpperCase()}</Text>
            <AnimatedNumber value={k.value} style={StyleSheet.flatten([styles.tileValue, k.hot && { color: Colors.black }])} delay={0} duration={700} />
            <Text style={[styles.tileSub, k.hot && { color: Colors.black }]} numberOfLines={1}>{k.sub}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.grid, { alignItems: 'stretch' }]}>
        <BarChart title="New players" rows={data.series} pick={(r) => r.signups} color={Colors.primary} style={desktop ? styles.third : styles.full} />
        <BarChart title="Messages from players" rows={data.series} pick={(r) => r.messages} color={Colors.white} style={desktop ? styles.third : styles.full} />
        <BarChart title="Players who opened the app" rows={data.series} pick={(r) => r.opened} color={Colors.textSecondary} style={desktop ? styles.third : styles.full} />
      </View>

      <View style={[styles.grid, { alignItems: 'stretch' }]}>
        <Breakdown title="Countries" rows={data.countries} style={desktop ? styles.quarter : styles.half} />
        <Breakdown title="Languages" rows={data.languages} style={desktop ? styles.quarter : styles.half} />
        <Breakdown title="Tiers" rows={data.tiers} style={desktop ? styles.quarter : styles.half} />
        <Breakdown title="Favourite teams" rows={data.teams} style={desktop ? styles.quarter : styles.half} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>TOP CHATTERS · 7 DAYS</Text>
        {data.top_chatters.length === 0 && <Text style={styles.empty}>Nobody chatted this week.</Text>}
        {data.top_chatters.map((c, i) => (
          <Pressable key={c.id} onPress={() => onPick({ id: c.id, name: c.name })} style={({ hovered }: { hovered?: boolean }) => [styles.listRow, hovered && styles.hover]}>
            <Text style={styles.rank}>{String(i + 1).padStart(2, '0')}</Text>
            <Text style={styles.listName} numberOfLines={1}>{c.name}</Text>
            <Text style={styles.listNum}>{c.n} msgs →</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const pct = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 100)}%` : '—');

/** Daily bars; hover or tap a bar to read its day. */
function BarChart({ title, rows, pick, color, style }: {
  title: string; rows: Overview['series']; pick: (r: Overview['series'][number]) => number; color: string; style: object;
}) {
  const values = rows.map(pick);
  const max = Math.max(1, ...values);
  const total = values.reduce((a, b) => a + b, 0);
  const [focus, setFocus] = useState<number | null>(null);
  const f = focus != null ? rows[focus] : null;

  return (
    <View style={[styles.card, style]}>
      <View style={styles.chartHead}>
        <Text style={styles.cardTitle} numberOfLines={1}>{title.toUpperCase()}</Text>
        <Text style={styles.chartValue}>{f ? `${dateShort(f.d)} · ${values[focus!]}` : `Σ ${total}`}</Text>
      </View>
      <View style={styles.bars}>
        {values.map((v, i) => (
          <Pressable
            key={rows[i].d}
            onHoverIn={() => setFocus(i)}
            onHoverOut={() => setFocus(null)}
            onPress={() => setFocus(i === focus ? null : i)}
            style={styles.barSlot}
          >
            <View style={[styles.bar, { height: `${Math.max(v > 0 ? 4 : 1, (v / max) * 100)}%`, backgroundColor: v > 0 ? color : Colors.line }, focus === i && { backgroundColor: Colors.primary }]} />
          </Pressable>
        ))}
      </View>
      <View style={styles.axis}>
        <Meta>{rows.length ? dateShort(rows[0].d) : ''}</Meta>
        <Meta>{`MAX ${max}`}</Meta>
        <Meta>{rows.length ? dateShort(rows[rows.length - 1].d) : ''}</Meta>
      </View>
    </View>
  );
}

function Breakdown({ title, rows, style }: { title: string; rows: Count[]; style: object }) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <View style={[styles.card, style]}>
      <Text style={styles.cardTitle}>{title.toUpperCase()}</Text>
      {rows.length === 0 && <Text style={styles.empty}>No data yet.</Text>}
      {rows.slice(0, 10).map((r) => (
        <View key={r.k} style={styles.breakRow}>
          <View style={styles.breakTop}>
            <Text style={styles.breakKey} numberOfLines={1}>{r.k.toUpperCase()}</Text>
            <Text style={styles.breakNum}>{r.n}</Text>
          </View>
          <View style={styles.breakTrack}><View style={[styles.breakFill, { width: `${(r.n / max) * 100}%` }]} /></View>
        </View>
      ))}
    </View>
  );
}

// ── Players ──────────────────────────────────────────────────────────────────
function PlayersTab({ desktop, onPick }: { desktop: boolean; onPick: (p: Picked) => void }) {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    const id = setTimeout(() => {
      fetchAdminUsers(search).then(setUsers).catch((e) => setError(String(e?.message ?? e)));
    }, 250);
    return () => clearTimeout(id);
  }, [search]);

  return (
    <View style={{ gap: 12 }}>
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search name, number or team…"
        placeholderTextColor={Colors.textMuted}
        style={styles.search}
      />
      {error && <ErrorBox text={error} />}
      {!users && !error && <ActivityIndicator color={Colors.primary} style={{ marginTop: 30 }} />}
      {users && <Meta>{`${users.length} PLAYERS · NEWEST FIRST`}</Meta>}
      {desktop && users && users.length > 0 && (
        <View style={[styles.userRow, styles.userHead]}>
          <Text style={[styles.colName, styles.headText]}>PLAYER</Text>
          <Text style={[styles.colSmall, styles.headText]}>COUNTRY</Text>
          <Text style={[styles.colMid, styles.headText]}>TIER · XP</Text>
          <Text style={[styles.colMid, styles.headText]}>TEAM</Text>
          <Text style={[styles.colSmall, styles.headText]}>JOINED</Text>
          <Text style={[styles.colSmall, styles.headText]}>LAST CHAT</Text>
          <Text style={[styles.colNum, styles.headText]}>MSGS</Text>
          <Text style={[styles.colNum, styles.headText]}>TIPS</Text>
          <Text style={[styles.colBadges, styles.headText]}> </Text>
        </View>
      )}
      {users?.map((u) => {
        const name = u.name?.trim() || u.phone || '—';
        const open = () => onPick({ id: u.id, name });
        return desktop ? (
          <Pressable key={u.id} onPress={open} style={({ hovered }: { hovered?: boolean }) => [styles.userRow, hovered && styles.hover]}>
            <View style={styles.colName}>
              <Text style={styles.userName} numberOfLines={1}>{name}</Text>
              <Text style={styles.userMeta} numberOfLines={1}>{u.phone ?? ''}</Text>
            </View>
            <Text style={[styles.colSmall, styles.cell]}>{[u.country, u.language].filter(Boolean).join(' · ') || '—'}</Text>
            <Text style={[styles.colMid, styles.cell]} numberOfLines={1}>{`${u.vip_tier ?? 'INITIATE'} · ${u.xp ?? 0}`}</Text>
            <Text style={[styles.colMid, styles.cell]} numberOfLines={1}>{u.favourite_team ?? '—'}</Text>
            <Text style={[styles.colSmall, styles.cell]}>{dateShort(u.created_at)}</Text>
            <Text style={[styles.colSmall, styles.cell]}>{ago(u.last_message_at)}</Text>
            <Text style={[styles.colNum, styles.cellNum]}>{u.messages}</Text>
            <Text style={[styles.colNum, styles.cellNum]}>{u.tips}</Text>
            <View style={[styles.colBadges, styles.badges]}><Badges u={u} /></View>
          </Pressable>
        ) : (
          <Pressable key={u.id} onPress={open} style={styles.userCard}>
            <View style={styles.breakTop}>
              <Text style={styles.userName} numberOfLines={1}>{name}</Text>
              <Text style={styles.userMeta}>{dateShort(u.created_at)}</Text>
            </View>
            <Text style={styles.userMeta} numberOfLines={1}>
              {[u.country, u.language, u.vip_tier, u.favourite_team].filter(Boolean).join(' · ')}
            </Text>
            <View style={[styles.breakTop, { marginTop: 4 }]}>
              <Text style={styles.cell}>{`${u.messages} msgs · ${u.tips} tips · last ${ago(u.last_message_at)}`}</Text>
              <View style={styles.badges}><Badges u={u} /></View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function Badges({ u }: { u: AdminUser }) {
  return (
    <>
      {u.push && <Text style={styles.badge}>PUSH</Text>}
      {u.crm && <Text style={[styles.badge, styles.badgeLime]}>GB</Text>}
    </>
  );
}

// ── Chats ────────────────────────────────────────────────────────────────────
function ChatsTab({ onPick }: { onPick: (p: Picked) => void }) {
  const [rows, setRows] = useState<AdminMessage[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [more, setMore] = useState(true);

  const load = useCallback((before?: string) => {
    setError(null);
    fetchAdminMessages(null, before)
      .then((list) => {
        setMore(list.length === 100);
        setRows((prev) => (before && prev ? [...prev, ...list] : list));
      })
      .catch((e) => setError(String(e?.message ?? e)));
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <View style={{ gap: 10 }}>
      <View style={styles.periodRow}>
        <Meta>WHAT PLAYERS WRITE · NEWEST FIRST</Meta>
        <Pressable onPress={() => load()} style={styles.chip}><Text style={styles.chipText}>↻</Text></Pressable>
      </View>
      {error && <ErrorBox text={error} onRetry={() => load()} />}
      {!rows && !error && <ActivityIndicator color={Colors.primary} style={{ marginTop: 30 }} />}
      {rows?.length === 0 && <Text style={styles.empty}>No messages yet.</Text>}
      {rows?.map((m) => (
        <Pressable key={m.id} onPress={() => onPick({ id: m.user_id, name: m.name ?? '—' })} style={({ hovered }: { hovered?: boolean }) => [styles.feedRow, hovered && styles.hover]}>
          <View style={styles.breakTop}>
            <Text style={styles.userName} numberOfLines={1}>{m.name ?? '—'}</Text>
            <Text style={styles.userMeta}>{`${dateTime(m.created_at)} · ${ago(m.created_at)}`}</Text>
          </View>
          <Text style={styles.feedText} numberOfLines={4}>{m.content}</Text>
        </Pressable>
      ))}
      {rows && rows.length > 0 && more && (
        <Pressable onPress={() => load(rows[rows.length - 1].created_at)} style={styles.moreBtn}>
          <Text style={styles.chipText}>LOAD OLDER</Text>
        </Pressable>
      )}
    </View>
  );
}

// ── One player's conversation ────────────────────────────────────────────────
function Conversation({ user, onClose }: { user: Picked; onClose: () => void }) {
  const [rows, setRows] = useState<AdminMessage[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [more, setMore] = useState(true);

  const load = useCallback((before?: string) => {
    fetchAdminMessages(user.id, before)
      .then((list) => {
        setMore(list.length === 100);
        setRows((prev) => (before && prev ? [...prev, ...list] : list));
      })
      .catch((e) => setError(String(e?.message ?? e)));
  }, [user.id]);
  useEffect(() => { setRows(null); setError(null); load(); }, [load]);

  // Newest first from the server; read top to bottom like a chat.
  const ordered = useMemo(() => (rows ? [...rows].reverse() : null), [rows]);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.convHead}>
        <View style={{ flex: 1 }}>
          <Meta color={Colors.primary}>CONVERSATION</Meta>
          <Text style={styles.convName} numberOfLines={1}>{user.name.toUpperCase()}</Text>
        </View>
        <Pressable onPress={onClose} hitSlop={8} style={styles.close}><Text style={styles.closeText}>✕</Text></Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.convBody}>
        {more && rows && rows.length > 0 && (
          <Pressable onPress={() => load(rows[rows.length - 1].created_at)} style={styles.moreBtn}>
            <Text style={styles.chipText}>LOAD OLDER</Text>
          </Pressable>
        )}
        {error && <ErrorBox text={error} />}
        {!ordered && !error && <ActivityIndicator color={Colors.primary} style={{ marginTop: 30 }} />}
        {ordered?.length === 0 && <Text style={styles.empty}>No messages.</Text>}
        {ordered?.map((m) => (
          <View key={m.id} style={[styles.bubble, m.role === 'user' ? styles.bubbleUser : styles.bubbleBot]}>
            <Text style={styles.bubbleMeta}>{`${m.role === 'user' ? 'PLAYER' : 'BETINA'} · ${dateTime(m.created_at)}`}</Text>
            <Text style={styles.bubbleText}>{m.content}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// ── Social: BETina on X ──────────────────────────────────────────────────────
const MODES: { k: SocialMode; label: string; hint: string }[] = [
  { k: 'off', label: 'OFF', hint: 'Stopped. BETina writes and posts nothing.' },
  { k: 'drafts', label: 'DRAFTS', hint: 'BETina writes, the team decides. Only approved posts go out.' },
  { k: 'auto', label: 'AUTO', hint: 'Match days, polls, goals, results, news and time travel go out on their own. Replies and anything the filter held back still wait here.' },
];
const VIEWS: { k: SocialStatus; label: string; empty: string }[] = [
  { k: 'draft', label: 'TO REVIEW', empty: 'Nothing to review. BETina writes her next post when there’s something to say.' },
  { k: 'approved', label: 'QUEUED', empty: 'Nothing waiting to go out.' },
  { k: 'posted', label: 'POSTED', empty: 'Nothing posted yet.' },
  { k: 'rejected', label: 'NOT POSTED', empty: 'Nothing rejected or skipped.' },
];
const KINDS: Record<string, string> = {
  matchday: 'MATCH DAY', poll: 'POLL', goal: 'GOAL', result: 'FULL TIME', news: 'NEWS', history: 'TIME TRAVEL', reply: 'REPLY',
};
/** Like X: most emoji count double. */
const xLength = (s: string) => [...s].reduce((n, ch) => n + ((ch.codePointAt(0) ?? 0) > 0x10ff ? 2 : 1), 0);

function SocialTab({ desktop }: { desktop: boolean }) {
  const [view, setView] = useState<SocialStatus>('draft');
  const [data, setData] = useState<SocialState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setError(null);
    fetchSocial(view).then(setData).catch((e) => setError(String(e?.message ?? e)));
  }, [view]);
  useEffect(() => { setData(null); load(); }, [load]);

  const changeMode = async (mode: SocialMode) => {
    setBusy(true);
    try {
      await setSocialMode(mode);
      load();
    } catch (e) {
      setError(String((e as Error)?.message ?? e));
    } finally {
      setBusy(false);
    }
  };

  if (error) return <ErrorBox text={error} onRetry={load} />;
  if (!data) return <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />;
  const s = data.settings;
  const count = (k: SocialStatus) => (k === 'rejected'
    ? (data.counts.rejected ?? 0) + (data.counts.skipped ?? 0) + (data.counts.failed ?? 0)
    : data.counts[k] ?? 0);

  return (
    <View style={{ gap: 14 }}>
      <View style={styles.card}>
        <View style={styles.breakTop}>
          <Text style={styles.cardTitle}>BETINA ON X</Text>
          <Text style={[styles.badge, s.x_ready && styles.badgeLime]}>{s.x_ready ? 'X CONNECTED' : 'X NOT CONNECTED · PREVIEW ONLY'}</Text>
        </View>
        <Text style={styles.userMeta}>
          {`INSTAGRAM + FACEBOOK: ${!s.meta_ready ? 'NOT CONNECTED' : s.meta_mode === 'auto' ? 'ON (TIME TRAVEL, RESULTS, NEWS)' : 'OFF'}`}
        </Text>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {MODES.map((m) => (
            <Pressable key={m.k} disabled={busy} onPress={() => changeMode(m.k)} style={[styles.chip, s.mode === m.k && (m.k === 'off' ? styles.chipDanger : styles.chipOn)]}>
              <Text style={[styles.chipText, s.mode === m.k && styles.chipTextOn]}>{m.label}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.cell}>{MODES.find((m) => m.k === s.mode)?.hint}</Text>
        <Meta>{`${data.posted_24h} / ${s.daily_limit} POSTED IN 24 H · ${s.lang.toUpperCase()} · LAST RUN ${ago(s.last_run)}`}</Meta>
      </View>

      <View style={styles.periodRow}>
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          {VIEWS.map((v) => (
            <Pressable key={v.k} onPress={() => setView(v.k)} style={[styles.chip, view === v.k && styles.chipOn]}>
              <Text style={[styles.chipText, view === v.k && styles.chipTextOn]}>{`${v.label} · ${count(v.k)}`}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable onPress={load} style={styles.chip}><Text style={styles.chipText}>↻</Text></Pressable>
      </View>

      {data.posts.length === 0 && <Text style={styles.empty}>{VIEWS.find((v) => v.k === view)?.empty}</Text>}
      <View style={[styles.grid, { alignItems: 'flex-start' }]}>
        {data.posts.map((p) => <SocialCard key={p.id} post={p} onDone={load} style={desktop ? styles.half : styles.full} />)}
      </View>
    </View>
  );
}

function SocialCard({ post, onDone, style }: { post: SocialPost; onDone: () => void; style: object }) {
  const editable = post.status === 'draft' || post.status === 'approved' || post.status === 'failed';
  const [text, setText] = useState(post.text);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const len = xLength(text);
  const blocked = busy || len > 280 || !text.trim();

  const decide = async (action: 'approve' | 'reject') => {
    setBusy(true);
    setError(null);
    try {
      await decideSocial(post.id, action, action === 'approve' && text !== post.text ? text : undefined);
      onDone();
    } catch (e) {
      setError(String((e as Error)?.message ?? e));
      setBusy(false);
    }
  };

  return (
    <View style={[styles.card, style]}>
      <View style={styles.breakTop}>
        <Text style={[styles.badge, styles.badgeLime]}>{KINDS[post.kind] ?? post.kind.toUpperCase()}</Text>
        <Text style={styles.userMeta}>{`${dateTime(post.posted_at ?? post.created_at)} · ${ago(post.posted_at ?? post.created_at)}`}</Text>
      </View>
      {post.reply_author && (
        <View style={styles.quote}>
          <Text style={styles.userMeta}>{`@${post.reply_author} WROTE`}</Text>
          <Text style={styles.feedText}>{post.reply_text}</Text>
        </View>
      )}
      {editable
        ? <TextInput multiline value={text} onChangeText={setText} style={[styles.search, styles.postInput]} />
        : <Text style={styles.postText}>{post.text}</Text>}
      {post.has_card && (
        <Image source={{ uri: socialCardUrl(post.id) }} style={styles.cardImage} resizeMode="cover" accessibilityLabel="Image card for this post" />
      )}
      {post.poll && (
        <View style={{ gap: 4 }}>
          {post.poll.map((o) => <Text key={o} style={styles.pollOption}>{o}</Text>)}
        </View>
      )}
      <View style={styles.breakTop}>
        <Text style={[styles.userMeta, { flex: 1 }]} numberOfLines={3}>{post.context ?? ''}</Text>
        {editable && <Text style={[styles.userMeta, len > 280 && { color: Colors.danger }]}>{`${len}/280`}</Text>}
      </View>
      {post.flags.length > 0 && <Text style={styles.flagText}>{`HELD BACK: ${post.flags.join(', ').replace(/_/g, ' ').toUpperCase()}`}</Text>}
      {post.error && <Text style={styles.flagText}>{post.error}</Text>}
      {error && <Text style={styles.flagText}>{error}</Text>}
      {editable && (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable disabled={blocked} onPress={() => decide('approve')} style={[styles.approveBtn, blocked && { opacity: 0.5 }]}>
            <Text style={styles.denyBtnText}>{post.status === 'approved' ? 'SAVE' : post.status === 'failed' ? 'RETRY' : 'APPROVE'}</Text>
          </Pressable>
          <Pressable disabled={busy} onPress={() => decide('reject')} style={styles.rejectBtn}>
            <Text style={styles.chipText}>REJECT</Text>
          </Pressable>
        </View>
      )}
      {post.x_id && (
        <Pressable onPress={() => Linking.openURL(`https://x.com/i/web/status/${post.x_id}`)}>
          <Text style={styles.errorRetry}>OPEN ON X →</Text>
        </Pressable>
      )}
      {post.meta_status && (
        <Text style={post.meta_status === 'posted' ? styles.userMeta : styles.flagText}>
          {post.meta_status === 'posted'
            ? `INSTAGRAM ${post.ig_id ? '✓' : '✗'} · FACEBOOK ${post.fb_id ? '✓' : '✗'}${post.meta_error ? ` — ${post.meta_error}` : ''}`
            : `INSTAGRAM/FACEBOOK ${post.meta_status.toUpperCase()}${post.meta_error ? `: ${post.meta_error}` : ''}`}
        </Text>
      )}
    </View>
  );
}

function ErrorBox({ text, onRetry }: { text: string; onRetry?: () => void }) {
  return (
    <View style={styles.error}>
      <Text style={styles.errorText}>{`Could not load: ${text}`}</Text>
      {onRetry && <Pressable onPress={onRetry}><Text style={styles.errorRetry}>TRY AGAIN</Text></Pressable>}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  cardImage: { width: '100%', aspectRatio: 16 / 9, backgroundColor: Colors.surface },
  center: { alignItems: 'center', justifyContent: 'center', gap: 14 },
  row: { flex: 1, flexDirection: 'row' },
  content: { padding: 16, gap: 18 },
  contentDesktop: { paddingHorizontal: 32, paddingTop: 24, maxWidth: 1400, width: '100%', alignSelf: 'center' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  title: { ...displayType(56, 58), color: Colors.white },

  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.line },
  tab: { paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 3, borderBottomColor: Colors.background },
  tabOn: { borderBottomColor: Colors.primary },
  tabText: { color: Colors.textMuted, fontSize: 16, fontFamily: Fonts.label, letterSpacing: 0.6 },
  tabTextOn: { color: Colors.white },

  periodRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' },
  chip: { borderWidth: 1.5, borderColor: Colors.borderStrong, paddingVertical: 6, paddingHorizontal: 10 },
  chipOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { color: Colors.textSecondary, fontSize: 11, fontFamily: Fonts.monoBold, letterSpacing: 0.6 },
  chipTextOn: { color: Colors.black },
  chipDanger: { backgroundColor: Colors.danger, borderColor: Colors.danger },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.line, padding: 14, gap: 4 },
  tileDesktop: { flexBasis: '23%', flexGrow: 1 },
  tilePhone: { flexBasis: '46%', flexGrow: 1 },
  tileHot: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tileLabel: { color: Colors.textMuted, fontSize: 10, fontFamily: Fonts.monoBold, letterSpacing: 0.8 },
  tileValue: { ...displayType(40, 44), color: Colors.white },
  tileSub: { color: Colors.textSecondary, fontSize: 12, fontFamily: Fonts.regular },

  full: { flexBasis: '100%' },
  half: { flexBasis: '46%', flexGrow: 1 },
  third: { flexBasis: '31%', flexGrow: 1 },
  quarter: { flexBasis: '23%', flexGrow: 1 },
  card: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.line, padding: 14, gap: 8 },
  cardTitle: { color: Colors.white, fontSize: 13, fontFamily: Fonts.label, letterSpacing: 0.7, flexShrink: 1 },
  empty: { color: Colors.textMuted, fontSize: 13, fontFamily: Fonts.regular, paddingVertical: 6 },

  chartHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  chartValue: { color: Colors.primary, fontSize: 12, fontFamily: Fonts.monoBold },
  bars: { height: 120, flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  barSlot: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%' },
  axis: { flexDirection: 'row', justifyContent: 'space-between' },

  breakRow: { gap: 4 },
  breakTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  breakKey: { flex: 1, color: Colors.textSecondary, fontSize: 12, fontFamily: Fonts.label, letterSpacing: 0.4 },
  breakNum: { color: Colors.white, fontSize: 12, fontFamily: Fonts.monoBold },
  breakTrack: { height: 4, backgroundColor: Colors.line },
  breakFill: { height: 4, backgroundColor: Colors.primary },

  listRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: Colors.line },
  hover: { backgroundColor: Colors.cardElevated },
  rank: { width: 22, color: Colors.textFaint, fontSize: 11, fontFamily: Fonts.mono },
  listName: { flex: 1, color: Colors.white, fontSize: 15, fontFamily: Fonts.label },
  listNum: { color: Colors.primary, fontSize: 12, fontFamily: Fonts.monoBold },

  search: {
    borderWidth: 1.5, borderColor: Colors.borderStrong, backgroundColor: Colors.surface, color: Colors.white,
    paddingVertical: 12, paddingHorizontal: 14, fontSize: 15, fontFamily: Fonts.regular,
  },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: Colors.line },
  userHead: { paddingVertical: 6 },
  headText: { color: Colors.textMuted, fontSize: 10, fontFamily: Fonts.monoBold, letterSpacing: 0.8 },
  colName: { flex: 2.2, minWidth: 0 },
  colMid: { flex: 1.4 },
  colSmall: { flex: 1 },
  colNum: { width: 52, textAlign: 'right' },
  colBadges: { width: 92 },
  cell: { color: Colors.textSecondary, fontSize: 13, fontFamily: Fonts.regular },
  cellNum: { color: Colors.white, fontSize: 13, fontFamily: Fonts.monoBold },
  userName: { color: Colors.white, fontSize: 15, fontFamily: Fonts.label, flexShrink: 1 },
  userMeta: { color: Colors.textMuted, fontSize: 11, fontFamily: Fonts.mono },
  userCard: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.line, padding: 12, gap: 3 },
  badges: { flexDirection: 'row', gap: 4, justifyContent: 'flex-end' },
  badge: { color: Colors.textSecondary, fontSize: 9, fontFamily: Fonts.monoBold, borderWidth: 1, borderColor: Colors.borderStrong, paddingHorizontal: 5, paddingVertical: 1 },
  badgeLime: { color: Colors.black, backgroundColor: Colors.primary, borderColor: Colors.primary },

  feedRow: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.line, padding: 12, gap: 6 },
  feedText: { color: Colors.textSecondary, fontSize: 14, lineHeight: 20, fontFamily: Fonts.regular },
  moreBtn: { alignSelf: 'center', borderWidth: 1.5, borderColor: Colors.borderStrong, paddingVertical: 8, paddingHorizontal: 14, marginVertical: 6 },

  panel: { width: 440, borderLeftWidth: 1, borderLeftColor: Colors.line, backgroundColor: Colors.background },
  convHead: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.line },
  convName: { ...displayType(26, 30), color: Colors.white },
  close: { width: 38, height: 38, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: Colors.black, fontSize: 16, fontFamily: Fonts.bold },
  convBody: { padding: 16, gap: 10 },
  bubble: { maxWidth: '88%', padding: 10, gap: 4 },
  bubbleUser: { alignSelf: 'flex-end', borderWidth: 1.5, borderColor: Colors.primary },
  bubbleBot: { alignSelf: 'flex-start', backgroundColor: Colors.card },
  bubbleMeta: { color: Colors.textMuted, fontSize: 9, fontFamily: Fonts.monoBold, letterSpacing: 0.6 },
  bubbleText: { color: Colors.white, fontSize: 14, lineHeight: 20, fontFamily: Fonts.regular },

  quote: { borderLeftWidth: 3, borderLeftColor: Colors.borderStrong, paddingLeft: 10, gap: 2 },
  postInput: { minHeight: 96, lineHeight: 21, textAlignVertical: 'top' },
  postText: { color: Colors.white, fontSize: 15, lineHeight: 21, fontFamily: Fonts.regular },
  pollOption: { color: Colors.white, borderWidth: 1, borderColor: Colors.borderStrong, paddingVertical: 6, paddingHorizontal: 10, fontSize: 13, fontFamily: Fonts.label },
  flagText: { color: Colors.danger, fontSize: 11, fontFamily: Fonts.monoBold, letterSpacing: 0.4 },
  approveBtn: { backgroundColor: Colors.primary, paddingVertical: 10, paddingHorizontal: 16 },
  rejectBtn: { borderWidth: 1.5, borderColor: Colors.borderStrong, paddingVertical: 10, paddingHorizontal: 16, justifyContent: 'center' },

  error: { borderWidth: 1, borderColor: Colors.danger, padding: 12, gap: 6 },
  errorText: { color: Colors.danger, fontSize: 13, fontFamily: Fonts.regular },
  errorRetry: { color: Colors.white, fontSize: 11, fontFamily: Fonts.monoBold, textDecorationLine: 'underline' },
  denyTitle: { ...displayType(48, 52), color: Colors.white },
  denyText: { color: Colors.textSecondary, fontSize: 14, fontFamily: Fonts.regular, textAlign: 'center', maxWidth: 360 },
  denyBtn: { backgroundColor: Colors.primary, paddingVertical: 12, paddingHorizontal: 18 },
  denyBtnText: { color: Colors.black, fontSize: 14, fontFamily: Fonts.label, letterSpacing: 0.5 },
});
