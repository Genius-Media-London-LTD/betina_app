// Tippspiel sync — Supabase Edge Function (Deno), every 10 min via pg_cron.
//
// 1. Pulls the current season's fixtures + results of the Tippspiel
//    competitions from football-data.org into tip_matches. The score trigger
//    (010_tippspiel.sql) then scores the tips. Results count after 90 minutes.
// 2. Opens each season's bonus questions and resolves them once the season is
//    decided (league champion / last place, Champions League winner).
// 3. BETina as host: reminds players of untipped matches kicking off soon and
//    sends a recap once all of a player's tips of a day are scored.
//
// Deploy: supabase functions deploy tippspiel-sync --no-verify-jwt
// Env:    SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, FOOTBALL_DATA_API_KEY
// pg_cron calls it without a key (see 010_tippspiel.sql), so it is a public
// endpoint: it rate-limits itself and a call within MIN_INTERVAL_MS of the last
// sync does nothing (protects the football-data.org quota of 10 calls/min).

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const FD_API = 'https://api.football-data.org/v4';
const EXPO_PUSH = 'https://exp.host/--/api/v2/push/send';
const MIN_INTERVAL_MS = 4 * 60_000;
const LEAGUES = new Set(['BL1', 'PL', 'PD', 'SA']);

type Team = { id: number | null; name: string | null; shortName?: string | null; tla?: string | null; crest?: string | null };
type Score = { home: number | null; away: number | null };
type FdMatch = {
  id: number;
  utcDate: string;
  status: string;
  matchday: number | null;
  stage: string | null;
  homeTeam: Team;
  awayTeam: Team;
  score: { winner: string | null; duration: string; fullTime: Score; regularTime?: Score };
  season: { startDate: string; endDate: string; currentMatchday: number | null };
};

// deno-lint-ignore no-explicit-any
type Db = SupabaseClient<any, 'public', any>;

async function fd(path: string) {
  const r = await fetch(`${FD_API}${path}`, {
    headers: { 'X-Auth-Token': Deno.env.get('FOOTBALL_DATA_API_KEY') ?? '' },
  });
  if (!r.ok) throw new Error(`football-data ${r.status} ${path}`);
  return r.json();
}

/** Score after 90 minutes: extra time and penalties don't count. */
function regularScore(m: FdMatch): Score {
  const s = m.score;
  if (s.duration && s.duration !== 'REGULAR') return s.regularTime ?? { home: null, away: null };
  return s.fullTime ?? { home: null, away: null };
}

// ── 1. Fixtures + results ────────────────────────────────────────────────────
async function syncCompetition(db: Db, code: string) {
  const data = await fd(`/competitions/${code}/matches`);
  const matches: FdMatch[] = data.matches ?? [];
  if (matches.length === 0) return { code, matches: 0 };

  const season = matches[0].season;
  const seasonYear = Number(season.startDate.slice(0, 4));
  const rows = matches
    // Knockout ties whose teams aren't known yet come back without teams.
    .filter((m) => m.homeTeam?.id && m.awayTeam?.id && m.homeTeam.name && m.awayTeam.name)
    .map((m) => {
      const score = regularScore(m);
      return {
        id: m.id,
        competition: code,
        season: seasonYear,
        matchday: m.matchday,
        stage: m.stage,
        kickoff: m.utcDate,
        status: m.status,
        home_team_id: m.homeTeam.id,
        home_name: m.homeTeam.name,
        home_short: m.homeTeam.shortName ?? null,
        home_tla: m.homeTeam.tla ?? null,
        home_crest: m.homeTeam.crest ?? null,
        away_team_id: m.awayTeam.id,
        away_name: m.awayTeam.name,
        away_short: m.awayTeam.shortName ?? null,
        away_tla: m.awayTeam.tla ?? null,
        away_crest: m.awayTeam.crest ?? null,
        home_score: score.home,
        away_score: score.away,
        updated_at: new Date().toISOString(),
      };
    });

  for (let i = 0; i < rows.length; i += 200) {
    const { error } = await db.from('tip_matches').upsert(rows.slice(i, i + 200), { onConflict: 'id' });
    if (error) throw new Error(`upsert ${code}: ${error.message}`);
  }

  await db.from('tip_competitions').update({
    emblem: data.competition?.emblem ?? null,
    current_season: seasonYear,
    current_matchday: season.currentMatchday,
    season_start: season.startDate,
    season_end: season.endDate,
    synced_at: new Date().toISOString(),
  }).eq('code', code);

  await ensureBonusQuestions(db, code, seasonYear, season.startDate);
  await resolveBonusQuestions(db, code, seasonYear, matches);
  return { code, matches: rows.length };
}

// ── 2. Bonus questions ───────────────────────────────────────────────────────
async function ensureBonusQuestions(db: Db, code: string, season: number, startDate: string) {
  // Open for 5 weeks after the season start; when the Tippspiel launches
  // mid-season, players still get 3 weeks from now.
  const closes = new Date(Math.max(
    new Date(startDate).getTime() + 35 * 86_400_000,
    Date.now() + 21 * 86_400_000,
  )).toISOString();
  const questions = [{ competition: code, season, kind: 'champion', points: 10, closes_at: closes }];
  if (LEAGUES.has(code)) questions.push({ competition: code, season, kind: 'last_place', points: 5, closes_at: closes });
  await db.from('tip_bonus_questions').upsert(questions, { onConflict: 'competition,season,kind', ignoreDuplicates: true });
}

async function resolveBonusQuestions(db: Db, code: string, season: number, matches: FdMatch[]) {
  const { data: open } = await db.from('tip_bonus_questions')
    .select('id, kind').eq('competition', code).eq('season', season).is('answer_team_id', null);
  if (!open?.length) return;

  const answers: Record<string, number | null> = {};
  if (LEAGUES.has(code)) {
    const done = matches.every((m) => ['FINISHED', 'AWARDED', 'CANCELLED'].includes(m.status));
    if (!done) return;
    const standings = await fd(`/competitions/${code}/standings`);
    const table = (standings.standings ?? []).find((s: { type: string }) => s.type === 'TOTAL')?.table ?? [];
    if (table.length === 0) return;
    answers.champion = table[0].team.id;
    answers.last_place = table[table.length - 1].team.id;
  } else {
    const final = matches.find((m) => m.stage === 'FINAL' && m.status === 'FINISHED');
    if (!final) return;
    answers.champion = final.score.winner === 'HOME_TEAM' ? final.homeTeam.id
      : final.score.winner === 'AWAY_TEAM' ? final.awayTeam.id : null;
  }

  for (const q of open) {
    const team = answers[q.kind];
    if (team) {
      await db.from('tip_bonus_questions')
        .update({ answer_team_id: team, resolved_at: new Date().toISOString() })
        .eq('id', q.id);
    }
  }
}

// ── 3. BETina as host ────────────────────────────────────────────────────────
type Lang = 'en' | 'de' | 'es' | 'pt' | 'fr' | 'it' | 'ro';
const MSG: Record<Lang, {
  remindTitle: string; remind: (name: string, n: number) => string;
  recapTitle: string; recap: (name: string, pts: number, scored: number, exact: number, best: string | null) => string;
}> = {
  en: {
    remindTitle: 'Predictor ⏰',
    remind: (n, c) => `${n}, ${c === 1 ? '1 match kicks off' : `${c} matches kick off`} within the hour and you haven't tipped yet. Quick, before the deadline!`,
    recapTitle: 'Your matchday recap',
    recap: (n, p, s, e, b) => `${n}, ${p} ${p === 1 ? 'point' : 'points'} from ${s} ${s === 1 ? 'tip' : 'tips'}${e > 0 ? ` incl. ${e}× spot on${b ? ` (${b})` : ''} 🎯` : ''}. Let's see the ranking!`,
  },
  de: {
    remindTitle: 'Tippspiel ⏰',
    remind: (n, c) => `${n}, in unter einer Stunde ${c === 1 ? 'geht 1 Spiel' : `gehen ${c} Spiele`} los und dein Tipp fehlt noch. Schnell, bevor Tippschluss ist!`,
    recapTitle: 'Deine Tagesbilanz',
    recap: (n, p, s, e, b) => `${n}, ${p} ${p === 1 ? 'Punkt' : 'Punkte'} aus ${s} ${s === 1 ? 'Tipp' : 'Tipps'}${e > 0 ? `, davon ${e}× exakt${b ? ` (${b})` : ''} 🎯` : ''}. Schau mal in die Tabelle!`,
  },
  es: {
    remindTitle: 'Porra ⏰',
    remind: (n, c) => `${n}, en menos de una hora ${c === 1 ? 'empieza 1 partido' : `empiezan ${c} partidos`} y aún no has hecho tu pronóstico. ¡Rápido!`,
    recapTitle: 'Tu resumen del día',
    recap: (n, p, s, e, b) => `${n}, ${p} ${p === 1 ? 'punto' : 'puntos'} de ${s} ${s === 1 ? 'pronóstico' : 'pronósticos'}${e > 0 ? `, ${e}× resultado exacto${b ? ` (${b})` : ''} 🎯` : ''}. ¡Mira la clasificación!`,
  },
  pt: {
    remindTitle: 'Palpites ⏰',
    remind: (n, c) => `${n}, em menos de uma hora ${c === 1 ? 'começa 1 jogo' : `começam ${c} jogos`} e ainda não deste o teu palpite. Rápido!`,
    recapTitle: 'O teu resumo do dia',
    recap: (n, p, s, e, b) => `${n}, ${p} ${p === 1 ? 'ponto' : 'pontos'} em ${s} ${s === 1 ? 'palpite' : 'palpites'}${e > 0 ? `, ${e}× resultado exato${b ? ` (${b})` : ''} 🎯` : ''}. Vê a classificação!`,
  },
  fr: {
    remindTitle: 'Pronos ⏰',
    remind: (n, c) => `${n}, ${c === 1 ? '1 match commence' : `${c} matchs commencent`} dans moins d'une heure et tu n'as pas encore pronostiqué. Vite !`,
    recapTitle: 'Ton bilan du jour',
    recap: (n, p, s, e, b) => `${n}, ${p} ${p === 1 ? 'point' : 'points'} sur ${s} ${s === 1 ? 'prono' : 'pronos'}${e > 0 ? `, dont ${e}× score exact${b ? ` (${b})` : ''} 🎯` : ''}. Jette un œil au classement !`,
  },
  it: {
    remindTitle: 'Pronostici ⏰',
    remind: (n, c) => `${n}, tra meno di un'ora ${c === 1 ? 'inizia 1 partita' : `iniziano ${c} partite`} e manca ancora il tuo pronostico. Veloce!`,
    recapTitle: 'Il tuo riepilogo',
    recap: (n, p, s, e, b) => `${n}, ${p} ${p === 1 ? 'punto' : 'punti'} su ${s} ${s === 1 ? 'pronostico' : 'pronostici'}${e > 0 ? `, ${e}× risultato esatto${b ? ` (${b})` : ''} 🎯` : ''}. Guarda la classifica!`,
  },
  ro: {
    remindTitle: 'Pronosticuri ⏰',
    remind: (n, c) => `${n}, în mai puțin de o oră ${c === 1 ? 'începe 1 meci' : `încep ${c} meciuri`} și încă nu ai dat pronosticul. Repede!`,
    recapTitle: 'Bilanțul zilei',
    recap: (n, p, s, e, b) => `${n}, ${p} ${p === 1 ? 'punct' : 'puncte'} din ${s} ${s === 1 ? 'pronostic' : 'pronosticuri'}${e > 0 ? `, ${e}× scor exact${b ? ` (${b})` : ''} 🎯` : ''}. Vezi clasamentul!`,
  },
};

function msgFor(lang: string | null) {
  return MSG[(String(lang ?? 'en').slice(0, 2) as Lang)] ?? MSG.en;
}
const firstName = (name: string | null) => (name ?? '').trim().split(/\s+/)[0] || '';

async function deliver(
  db: Db,
  target: { user_id: string; push_token: string | null; notify_betina: boolean },
  triggerKey: string,
  title: string,
  body: string,
) {
  // Log first so an overlapping run can't double-send.
  await db.from('trigger_log').insert({ user_id: target.user_id, trigger_key: triggerKey, category: 'engagement' });
  await db.from('notifications').insert({ user_id: target.user_id, type: 'betina', title, body });
  if (target.notify_betina && target.push_token) {
    await fetch(EXPO_PUSH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: target.push_token, title, body, sound: 'default', data: { url: '/tippspiel' } }),
    }).catch(() => {});
  }
}

async function hostMessages(db: Db) {
  let reminders = 0;
  let recaps = 0;

  const { data: remind, error: e1 } = await db.rpc('tippspiel_reminder_targets');
  if (e1) console.error('reminder targets:', e1.message);
  for (const t of remind ?? []) {
    const m = msgFor(t.language);
    await deliver(db, t, 'tip_reminder', m.remindTitle, m.remind(firstName(t.name), Number(t.open_count)));
    reminders++;
  }

  const { data: recap, error: e2 } = await db.rpc('tippspiel_recap_targets');
  if (e2) console.error('recap targets:', e2.message);
  for (const t of recap ?? []) {
    const m = msgFor(t.language);
    const body = m.recap(firstName(t.name), Number(t.points), Number(t.scored), Number(t.exact), Number(t.exact) > 0 ? t.best : null);
    await deliver(db, t, `tip_recap:${t.day}`, m.recapTitle, body);
    recaps++;
  }
  return { reminders, recaps };
}

// ── Entry ────────────────────────────────────────────────────────────────────
Deno.serve(async () => {
  const db: Db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

  if (!Deno.env.get('FOOTBALL_DATA_API_KEY')) return json({ error: 'not_configured' }, 503);

  const { data: comps } = await db.from('tip_competitions').select('code, synced_at').order('sort_order');
  const last = Math.max(0, ...(comps ?? []).map((c) => (c.synced_at ? Date.parse(c.synced_at) : 0)));
  if (Date.now() - last < MIN_INTERVAL_MS) return json({ skipped: 'too_soon' });

  const results = [];
  for (const c of comps ?? []) {
    try {
      results.push(await syncCompetition(db, c.code));
    } catch (err) {
      console.error(c.code, (err as Error).message);
      results.push({ code: c.code, error: (err as Error).message });
    }
  }
  const host = await hostMessages(db);
  return json({ results, host });
});
