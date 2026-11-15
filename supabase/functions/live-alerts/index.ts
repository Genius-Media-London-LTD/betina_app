// BETina Live pushes — Supabase Edge Function (Deno), every 30 s (pg_cron,
// migration 021). Reads the new incidents from betina-server's live poll
// (/v1/live/incidents: kickoff, goal, red card, half time, full time) and
// pushes them to players who follow the team or the match (live_follows), or
// whose favourite team plays. Tapping opens the match page.
//
// BETina on Telegram: people who told her their club (telegram_chats.team_id,
// set by the bot's follow_team) get its goals and final scores as a message
// from her — unless they sent /stop.
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

// ── BETina on Telegram ───────────────────────────────────────────────────────
// [their team scores, the other team scores, full time: won, lost, draw] — {team} {opp} {line}
const TG_MSG: Record<string, [string, string, string, string, string]> = {
  en: ['GOAL for {team}!! ⚽ {line}', 'ouch.. {opp} score 🙈 {line}', 'full time: {line} — your team did it 💚', 'full time: {line}. come here, that one hurts', 'full time: {line}. a point is a point, hm?'],
  de: ['TOOOR für {team}!! ⚽ {line}', 'autsch.. {opp} trifft 🙈 {line}', 'abpfiff: {line} — dein team hat es gemacht 💚', 'abpfiff: {line}. komm her, das tut weh', 'abpfiff: {line}. ein punkt ist ein punkt, hm?'],
  es: ['¡GOOOL de {team}! ⚽ {line}', 'uf.. marca {opp} 🙈 {line}', 'final: {line} — tu equipo lo hizo 💚', 'final: {line}. ven aquí, esta duele', 'final: {line}. un punto es un punto, ¿no?'],
  pt: ['GOOOLO! marca {team} ⚽ {line}', 'ui.. marca {opp} 🙈 {line}', 'fim: {line} — a tua equipa conseguiu 💚', 'fim: {line}. anda cá, esta dói', 'fim: {line}. um ponto é um ponto, não?'],
  fr: ['BUUUT pour {team} !! ⚽ {line}', 'aïe.. {opp} marque 🙈 {line}', "c'est fini : {line} — ton équipe l'a fait 💚", "c'est fini : {line}. viens là, celle-là fait mal", "c'est fini : {line}. un point c'est un point, non ?"],
  it: ['GOOOL per {team}!! ⚽ {line}', 'ahi.. segna {opp} 🙈 {line}', "finita: {line} — la tua squadra ce l'ha fatta 💚", 'finita: {line}. vieni qui, questa fa male', 'finita: {line}. un punto è un punto, no?'],
  ro: ['GOOOL pentru {team}!! ⚽ {line}', 'au.. marchează {opp} 🙈 {line}', 'final: {line} — echipa ta a reușit 💚', 'final: {line}. vino aici, asta doare', 'final: {line}. un punct e un punct, nu?'],
  tr: ['GOOOL! {team} attı ⚽ {line}', 'of.. {opp} attı 🙈 {line}', 'maç bitti: {line} — takımın başardı 💚', 'maç bitti: {line}. gel buraya, bu acıttı', 'maç bitti: {line}. bir puan bir puandır, değil mi?'],
  hr: ['GOOOL za {team}!! ⚽ {line}', 'au.. {opp} zabija 🙈 {line}', 'kraj: {line} — tvoja ekipa je uspjela 💚', 'kraj: {line}. dođi, ovo boli', 'kraj: {line}. bod je bod, ha?'],
};

/** What BETina texts someone whose team (side 0 home, 1 away) is in this incident. */
function telegramLine(i: Incident, mine: 0 | 1, lang: string): string | null {
  const texts = TG_MSG[lang] ?? TG_MSG.en;
  const own = mine === 1 ? i.a : i.h;
  const opp = mine === 1 ? i.h : i.a;
  const score = `${i.h.n} ${i.g[0] ?? 0}:${i.g[1] ?? 0} ${i.a.n}`;
  let text: string;
  if (i.type === 'goal') {
    if (i.side !== 0 && i.side !== 1) return null;
    const who = [i.player, i.min ? `${i.min}'` : ''].filter(Boolean).join(' ');
    text = texts[i.side === mine ? 0 : 1].replace('{line}', who ? `${score} · ${who}` : score);
  } else if (i.type === 'ft') {
    const [gm, go] = mine === 1 ? [i.g[1] ?? 0, i.g[0] ?? 0] : [i.g[0] ?? 0, i.g[1] ?? 0];
    text = texts[gm > go ? 2 : gm < go ? 3 : 4].replace('{line}', score);
  } else return null;
  return text.replace('{team}', own.n).replace('{opp}', opp.n);
}

// deno-lint-ignore no-explicit-any
async function telegramAlerts(supabase: any, list: Incident[]): Promise<number> {
  const token = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const events = list.filter((i) => i.type === 'goal' || i.type === 'ft');
  if (!token || !events.length) return 0;
  const ids = [...new Set(events.flatMap((i) => [i.h.id, i.a.id]))];
  const { data: chats } = await supabase.from('telegram_chats')
    .select('chat_id, lang, team_id, history').in('team_id', ids).eq('adult', true).eq('proactive', true).limit(2000);
  let sent = 0;
  for (const chat of chats ?? []) {
    const lines: string[] = [];
    for (const i of events) {
      if (i.h.id !== chat.team_id && i.a.id !== chat.team_id) continue;
      const text = telegramLine(i, i.a.id === chat.team_id ? 1 : 0, chat.lang);
      if (!text) continue;
      const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chat.chat_id, text }),
      }).then((x) => x.json()).catch(() => ({ ok: false }));
      if (r.ok) { lines.push(text); sent += 1; }
      // They blocked her: no more messages from her side.
      else if (r.error_code === 403) { await supabase.from('telegram_chats').update({ proactive: false }).eq('chat_id', chat.chat_id); break; }
    }
    // She should know what she texted when they answer.
    if (lines.length) {
      const history = [...(Array.isArray(chat.history) ? chat.history : []), ...lines.map((content) => ({ role: 'assistant', content }))].slice(-30);
      await supabase.from('telegram_chats').update({ history }).eq('chat_id', chat.chat_id);
    }
  }
  return sent;
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
  const telegram = await telegramAlerts(supabase, list).catch((err) => { console.error('telegram alerts:', err.message); return 0; });

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
  if (!users.size) return new Response(JSON.stringify({ sent: 0, telegram, seq: res.seq }), { headers: { 'Content-Type': 'application/json' } });

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
  return new Response(JSON.stringify({ sent: messages.length, telegram, seq: res.seq }), { headers: { 'Content-Type': 'application/json' } });
});
