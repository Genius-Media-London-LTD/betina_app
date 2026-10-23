// "Beat BETina": BETina tips every Tippspiel match herself.
//
// Matches kicking off in the next 3 days get her tip once (betina_tips; her
// tips become visible to players at kickoff, see 014_tippspiel_v2.sql). The
// form context — table position, points per game, goals, last five results —
// is computed from our own tip_matches, so no extra football-data.org calls.
// Claude picks the scorelines; if it is unavailable or declines, a simple
// form formula fills in so BETina never skips a match.

import Anthropic from 'npm:@anthropic-ai/sdk';
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// deno-lint-ignore no-explicit-any
type Db = SupabaseClient<any, 'public', any>;

type Fixture = {
  id: number;
  competition: string;
  season: number;
  kickoff: string;
  home_team_id: number;
  home_name: string;
  away_team_id: number;
  away_name: string;
};
type Result = { home_team_id: number; away_team_id: number; home_score: number; away_score: number; kickoff: string };
type Form = { position: number; played: number; ppg: number; goalsFor: number; goalsAgainst: number; last5: string };
type Prediction = { id: number; home: number; away: number };

const MODEL = 'claude-opus-5-5';
const HORIZON_MS = 3 * 86_400_000;

/** League table + recent form per team from this season's finished matches. */
function formTable(results: Result[]): Map<number, Form> {
  const rows = new Map<number, { pts: number; played: number; gf: number; ga: number; seq: { ko: string; r: string }[] }>();
  const row = (id: number) => {
    let r = rows.get(id);
    if (!r) { r = { pts: 0, played: 0, gf: 0, ga: 0, seq: [] }; rows.set(id, r); }
    return r;
  };
  for (const m of results) {
    const h = row(m.home_team_id);
    const a = row(m.away_team_id);
    h.played++; a.played++;
    h.gf += m.home_score; h.ga += m.away_score;
    a.gf += m.away_score; a.ga += m.home_score;
    const res = Math.sign(m.home_score - m.away_score);
    h.pts += res > 0 ? 3 : res === 0 ? 1 : 0;
    a.pts += res < 0 ? 3 : res === 0 ? 1 : 0;
    h.seq.push({ ko: m.kickoff, r: res > 0 ? 'W' : res === 0 ? 'D' : 'L' });
    a.seq.push({ ko: m.kickoff, r: res < 0 ? 'W' : res === 0 ? 'D' : 'L' });
  }
  const order = [...rows.entries()].sort(
    ([, x], [, y]) => y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf,
  );
  const out = new Map<number, Form>();
  order.forEach(([id, r], i) => {
    out.set(id, {
      position: i + 1,
      played: r.played,
      ppg: r.played ? Math.round((r.pts / r.played) * 100) / 100 : 0,
      goalsFor: r.gf,
      goalsAgainst: r.ga,
      last5: r.seq.sort((x, y) => x.ko.localeCompare(y.ko)).slice(-5).map((s) => s.r).join(''),
    });
  });
  return out;
}

/** Fallback: points per game plus home advantage decide a common scoreline. */
function formulaTip(home: Form | undefined, away: Form | undefined): { home: number; away: number } {
  const diff = (home?.ppg ?? 1.3) - (away?.ppg ?? 1.3) + 0.35;
  if (diff > 1.1) return { home: 3, away: 1 };
  if (diff > 0.7) return { home: 2, away: 0 };
  if (diff > 0.25) return { home: 2, away: 1 };
  if (diff > -0.25) return { home: 1, away: 1 };
  if (diff > -0.7) return { home: 1, away: 2 };
  return { home: 0, away: 2 };
}

const SCHEMA = {
  type: 'object',
  properties: {
    predictions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          home: { type: 'integer' },
          away: { type: 'integer' },
        },
        required: ['id', 'home', 'away'],
        additionalProperties: false,
      },
    },
  },
  required: ['predictions'],
  additionalProperties: false,
};

const SYSTEM = `You are BETina, a football fan playing a free score-prediction game against the app's players (no money involved; the score after 90 minutes counts: 3 points for the exact score, 2 for the right winner and goal difference, 1 for the right outcome).
For every match, predict the exact 90-minute score from the table position, points per game, goals and recent form you are given (last5 is oldest to newest, W/D/L). Play to score points: pick realistic scorelines (1-0, 2-1, 1-1, 2-0, 0-0, 1-2, 3-1 …), lean on home advantage and form, and call draws when teams are close. Return one prediction per match id.`;

async function claudeTips(competition: string, fixtures: Fixture[], form: Map<number, Form>): Promise<Prediction[] | null> {
  if (!Deno.env.get('ANTHROPIC_API_KEY')) return null;
  const client = new Anthropic();
  const matches = fixtures.map((f) => ({
    id: f.id,
    home: { team: f.home_name, ...form.get(f.home_team_id) },
    away: { team: f.away_name, ...form.get(f.away_team_id) },
  }));
  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      // Route a refused request to the fallback model the API picks.
      // @ts-ignore: `fallbacks` is newer than some SDK type definitions
      fallbacks: 'default',
      system: SYSTEM,
      output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
      messages: [{ role: 'user', content: `Competition: ${competition}\n${JSON.stringify(matches)}` }],
    });
    if (response.stop_reason === 'refusal') return null;
    const text = response.content.find((b) => b.type === 'text');
    if (!text || text.type !== 'text') return null;
    const parsed = JSON.parse(text.text) as { predictions: Prediction[] };
    return parsed.predictions;
  } catch (err) {
    console.error('betina tips via Claude:', (err as Error).message);
    return null;
  }
}

/** Give BETina a tip for every match in the next 3 days that she hasn't tipped yet. */
export async function betinaTips(db: Db): Promise<{ tipped: number; via: string[] }> {
  const now = Date.now();
  const { data: upcoming } = await db.from('tip_matches')
    .select('id, competition, season, kickoff, home_team_id, home_name, away_team_id, away_name')
    .in('status', ['SCHEDULED', 'TIMED'])
    .gt('kickoff', new Date(now + 15 * 60_000).toISOString())
    .lt('kickoff', new Date(now + HORIZON_MS).toISOString())
    .order('kickoff')
    .limit(200);
  const fixtures = (upcoming ?? []) as Fixture[];
  if (fixtures.length === 0) return { tipped: 0, via: [] };

  const { data: done } = await db.from('betina_tips').select('match_id').in('match_id', fixtures.map((f) => f.id));
  const tipped = new Set((done ?? []).map((d) => d.match_id));
  const todo = fixtures.filter((f) => !tipped.has(f.id));
  if (todo.length === 0) return { tipped: 0, via: [] };

  const byComp = new Map<string, Fixture[]>();
  for (const f of todo) byComp.set(f.competition, [...(byComp.get(f.competition) ?? []), f]);

  const via: string[] = [];
  const rows: { match_id: number; home: number; away: number }[] = [];
  await Promise.all([...byComp.entries()].map(async ([competition, list]) => {
    const { data: results } = await db.from('tip_matches')
      .select('home_team_id, away_team_id, home_score, away_score, kickoff')
      .eq('competition', competition).eq('season', list[0].season).eq('status', 'FINISHED')
      .not('home_score', 'is', null).limit(1000);
    const form = formTable((results ?? []) as Result[]);
    const ai = await claudeTips(competition, list, form);
    const byId = new Map((ai ?? []).map((p) => [p.id, p]));
    via.push(`${competition}:${ai ? 'claude' : 'formula'}`);
    for (const f of list) {
      const p = byId.get(f.id);
      const tip = p ? { home: p.home, away: p.away } : formulaTip(form.get(f.home_team_id), form.get(f.away_team_id));
      const clamp = (n: number) => Math.min(9, Math.max(0, Math.round(Number(n) || 0)));
      rows.push({ match_id: f.id, home: clamp(tip.home), away: clamp(tip.away) });
    }
  }));

  const { error } = await db.from('betina_tips').upsert(rows, { onConflict: 'match_id', ignoreDuplicates: true });
  if (error) console.error('betina_tips upsert:', error.message);
  return { tipped: error ? 0 : rows.length, via };
}
