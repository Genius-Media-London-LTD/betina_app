// BETina Live pushes — Supabase Edge Function (Deno), every 30 s (pg_cron,
// migration 021). Reads the new incidents from betina-server's live poll
// (/v1/live/incidents: kickoff, goal, red card, half time, full time) and
// pushes them to players who follow the team or the match (live_follows), or
// whose favourite team plays. Tapping opens the match page.
//
// Deploy: supabase functions deploy live-alerts --no-verify-jwt
// (it only sends what the public live feed already shows; the cursor in
// live_alert_state makes repeated calls harmless).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const API = 'https://api.betina.geniusbet.com';
const EXPO_PUSH = 'https://exp.host/--/api/v2/push/send';
const FRESH_MS = 10 * 60_000; // never push stale incidents (e.g. after a pause)

type Team = { id: number; n: string };
type Incident = {
  seq: number; at: number; type: string; id: number; side?: 0 | 1; min?: number | null; player?: string | null;
  h: Team; a: Team; g: [number | null, number | null];
};

type Texts = {
  goal: [string, string]; kickoff: [string, string]; ht: [string, string]; ft: [string, string]; red: [string, string];
};
// [title, body] — {team} {h} {a} {score} {player} {min}
const MSG: Record<string, Texts> = {
  en: { goal: ['⚽ GOAL! {team}', '{h} {score} {a} · {player} {min}'], kickoff: ['Kick-off: {h} – {a}', 'Here we go! I’m watching with you.'], ht: ['Half time: {h} {score} {a}', 'Quick breather — second half coming up.'], ft: ['Full time: {h} {score} {a}', 'That’s it. Tap for the stats and ratings.'], red: ['🟥 Red card for {team}', '{h} {score} {a} · {player} {min}'] },
  de: { goal: ['⚽ TOR! {team}', '{h} {score} {a} · {player} {min}'], kickoff: ['Anpfiff: {h} – {a}', 'Los geht’s! Ich schau mit.'], ht: ['Halbzeit: {h} {score} {a}', 'Kurz durchatmen, gleich geht’s weiter.'], ft: ['Abpfiff: {h} {score} {a}', 'Aus und vorbei. Tipp für Statistik und Noten.'], red: ['🟥 Rot für {team}', '{h} {score} {a} · {player} {min}'] },
  es: { goal: ['⚽ ¡GOL! {team}', '{h} {score} {a} · {player} {min}'], kickoff: ['Empieza: {h} – {a}', '¡Vamos! Lo veo contigo.'], ht: ['Descanso: {h} {score} {a}', 'Respira, ahora viene la segunda parte.'], ft: ['Final: {h} {score} {a}', 'Se acabó. Toca para ver estadísticas y notas.'], red: ['🟥 Roja para {team}', '{h} {score} {a} · {player} {min}'] },
  pt: { goal: ['⚽ GOLO! {team}', '{h} {score} {a} · {player} {min}'], kickoff: ['Começou: {h} – {a}', 'Bora! Estou a ver contigo.'], ht: ['Intervalo: {h} {score} {a}', 'Respira, já vem a segunda parte.'], ft: ['Fim: {h} {score} {a}', 'Acabou. Toca para estatísticas e notas.'], red: ['🟥 Vermelho para {team}', '{h} {score} {a} · {player} {min}'] },
  fr: { goal: ['⚽ BUT ! {team}', '{h} {score} {a} · {player} {min}'], kickoff: ['Coup d’envoi : {h} – {a}', 'C’est parti ! Je regarde avec toi.'], ht: ['Mi-temps : {h} {score} {a}', 'On souffle, la deuxième arrive.'], ft: ['Fin : {h} {score} {a}', 'C’est fini. Touche pour les stats et les notes.'], red: ['🟥 Rouge pour {team}', '{h} {score} {a} · {player} {min}'] },
  it: { goal: ['⚽ GOL! {team}', '{h} {score} {a} · {player} {min}'], kickoff: ['Si parte: {h} – {a}', 'Via! La guardo con te.'], ht: ['Intervallo: {h} {score} {a}', 'Respira, arriva il secondo tempo.'], ft: ['Finale: {h} {score} {a}', 'Finita. Tocca per statistiche e voti.'], red: ['🟥 Rosso per {team}', '{h} {score} {a} · {player} {min}'] },
  ro: { goal: ['⚽ GOL! {team}', '{h} {score} {a} · {player} {min}'], kickoff: ['Start: {h} – {a}', 'Hai! Mă uit cu tine.'], ht: ['Pauză: {h} {score} {a}', 'Respiră, urmează repriza a doua.'], ft: ['Final: {h} {score} {a}', 'Gata. Atinge pentru statistici și note.'], red: ['🟥 Roșu pentru {team}', '{h} {score} {a} · {player} {min}'] },
  tr: { goal: ['⚽ GOL! {team}', '{h} {score} {a} · {player} {min}'], kickoff: ['Maç başladı: {h} – {a}', 'Hadi! Seninle izliyorum.'], ht: ['Devre arası: {h} {score} {a}', 'Biraz nefes al, ikinci yarı geliyor.'], ft: ['Maç sonu: {h} {score} {a}', 'Bitti. İstatistik ve notlar için dokun.'], red: ['🟥 {team} için kırmızı kart', '{h} {score} {a} · {player} {min}'] },
  hr: { goal: ['⚽ GOL! {team}', '{h} {score} {a} · {player} {min}'], kickoff: ['Počelo je: {h} – {a}', 'Idemo! Gledam s tobom.'], ht: ['Poluvrijeme: {h} {score} {a}', 'Predah, slijedi drugo poluvrijeme.'], ft: ['Kraj: {h} {score} {a}', 'Gotovo. Dodirni za statistiku i ocjene.'], red: ['🟥 Crveni za {team}', '{h} {score} {a} · {player} {min}'] },
};

function render(i: Incident, lang: string): { title: string; body: string } | null {
  const texts = (MSG[lang] ?? MSG.en)[i.type as keyof Texts];
  if (!texts) return null;
  const team = i.side === 1 ? i.a.n : i.h.n;
  const fill = (s: string) => s
    .replace('{team}', team).replace('{h}', i.h.n).replace('{a}', i.a.n)
    .replace('{score}', `${i.g[0] ?? 0}:${i.g[1] ?? 0}`)
    .replace('{player}', i.player ?? '').replace('{min}', i.min ? `${i.min}'` : '')
    .replace(/\s+·\s*$/, '').replace(/\s{2,}/g, ' ').trim();
  return { title: fill(texts[0]), body: fill(texts[1]) };
}

Deno.serve(async () => {
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: state } = await supabase.from('live_alert_state').select('seq').eq('id', 1).single();
  const since = Number(state?.seq ?? 0);

  let res = await fetch(`${API}/v1/live/incidents?since=${since}`).then((r) => r.json()) as { seq: number; incidents: Incident[] };
  // betina-server restarted (sequence starts over): take what's new since then.
  if (res.seq < since) res = await fetch(`${API}/v1/live/incidents?since=0`).then((r) => r.json());
  const now = Date.now();
  const list = res.incidents.filter((i) => now - i.at < FRESH_MS && ['goal', 'kickoff', 'ht', 'ft', 'red'].includes(i.type));
  await supabase.from('live_alert_state').update({ seq: res.seq, updated_at: new Date().toISOString() }).eq('id', 1);
  if (!list.length) return new Response(JSON.stringify({ sent: 0, seq: res.seq }), { headers: { 'Content-Type': 'application/json' } });

  // Who follows which team / match.
  const teams = [...new Set(list.flatMap((i) => [i.h.id, i.a.id]))];
  const matches = [...new Set(list.map((i) => i.id))];
  const names = [...new Set(list.flatMap((i) => [i.h.n, i.a.n]))];
  const [{ data: byTeam }, { data: byMatch }, { data: byFav }] = await Promise.all([
    supabase.from('live_follows').select('user_id, ref').eq('kind', 'team').in('ref', teams),
    supabase.from('live_follows').select('user_id, ref').eq('kind', 'match').in('ref', matches),
    supabase.from('profiles').select('id, favourite_team').in('favourite_team', names),
  ]);
  const users = new Set<string>([
    ...(byTeam ?? []).map((f) => f.user_id), ...(byMatch ?? []).map((f) => f.user_id), ...(byFav ?? []).map((p) => p.id),
  ]);
  if (!users.size) return new Response(JSON.stringify({ sent: 0, seq: res.seq }), { headers: { 'Content-Type': 'application/json' } });

  const { data: profiles } = await supabase
    .from('profiles').select('id, language, push_token, notify_events, favourite_team')
    .in('id', [...users]).not('push_token', 'is', null);

  const messages: { to: string; title: string; body: string; sound: string; data: { url: string } }[] = [];
  for (const p of profiles ?? []) {
    if (p.notify_events === false) continue;
    for (const i of list) {
      const followsTeam = (byTeam ?? []).some((f) => f.user_id === p.id && (Number(f.ref) === i.h.id || Number(f.ref) === i.a.id));
      const followsMatch = (byMatch ?? []).some((f) => f.user_id === p.id && Number(f.ref) === i.id);
      const fav = p.favourite_team === i.h.n || p.favourite_team === i.a.n;
      if (!followsTeam && !followsMatch && !fav) continue;
      // Favourite-only players already get the final result from match-alerts.
      if (i.type === 'ft' && !followsTeam && !followsMatch) continue;
      const m = render(i, p.language ?? 'en');
      if (m) messages.push({ to: p.push_token, ...m, sound: 'default', data: { url: `/match/${i.id}` } });
    }
  }

  for (let k = 0; k < messages.length; k += 100) {
    await fetch(EXPO_PUSH, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(messages.slice(k, k + 100)) })
      .catch((err) => console.error('expo push:', err.message));
  }
  return new Response(JSON.stringify({ sent: messages.length, seq: res.seq }), { headers: { 'Content-Type': 'application/json' } });
});
