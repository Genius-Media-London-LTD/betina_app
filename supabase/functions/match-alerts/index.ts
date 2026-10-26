// BETina proactive match alerts — Supabase Edge Function (Deno).
//
// Runs on a schedule (e.g. every 10 min via pg_cron). For every player who
// has a favourite team and a push token, it checks the team's most recent
// finished match. If that match is newer than the last one we alerted them
// about, it composes a BETina-style message ("Your team won! 🎉"), stores it
// in the notifications table (so it shows in-app) and sends a push.
//
// Deploy:
//   supabase functions deploy match-alerts --no-verify-jwt
// Schedule (SQL, once):
//   select cron.schedule('match-alerts', '*/10 * * * *',
//     $$ select net.http_post(
//          url := 'https://<project>.functions.supabase.co/match-alerts',
//          headers := jsonb_build_object('Authorization','Bearer <SERVICE_ROLE_KEY>')
//        ) $$);
//
// Env (set with `supabase secrets set`): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// BETina's own server (TheSportsDB proxy, see server/api/src/sportsdb.js).
const SPORTS_API = 'https://api.betina.geniusbet.com';
const EXPO_PUSH = 'https://exp.host/--/api/v2/push/send';

type MatchEvent = {
  id: string;
  home: string;
  away: string;
  homeScore: string | null;
  awayScore: string | null;
  date: string;
  league: string;
};

type Profile = {
  id: string;
  name: string | null;
  favourite_team: string | null;
  favourite_team_id: string | null;
  push_token: string | null;
  last_alerted_event_id: string | null;
  notify_events: boolean | null;
};

// A finished match the player hasn't been told about → BETina's message.
function buildMessage(p: Profile, m: MatchEvent): { title: string; body: string } | null {
  const hs = Number(m.homeScore);
  const as = Number(m.awayScore);
  if (Number.isNaN(hs) || Number.isNaN(as)) return null; // not actually finished

  const team = p.favourite_team ?? '';
  const isHome = m.home.toLowerCase().includes(team.toLowerCase());
  const teamScore = isHome ? hs : as;
  const oppScore = isHome ? as : hs;
  const opp = isHome ? m.away : m.home;
  const name = p.name ?? 'you';

  let body: string;
  if (teamScore > oppScore) body = `${team} won ${teamScore}–${oppScore} vs ${opp}! 🎉 Told you they had it in them, ${name} 😏`;
  else if (teamScore < oppScore) body = `${team} lost ${teamScore}–${oppScore} to ${opp}. Chin up ${name} — next one's ours 💪`;
  else body = `${team} drew ${teamScore}–${oppScore} with ${opp}. A point's a point, ${name} 🤝`;

  return { title: `${m.home} ${hs}–${as} ${m.away}`, body };
}

async function sendPush(token: string, title: string, body: string) {
  await fetch(EXPO_PUSH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: token, title, body, sound: 'default' }),
  });
}

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name, favourite_team, favourite_team_id, push_token, last_alerted_event_id, notify_events')
    .not('favourite_team_id', 'is', null)
    .not('push_token', 'is', null);

  let sent = 0;

  for (const p of (profiles ?? []) as Profile[]) {
    try {
      const r = await fetch(`${SPORTS_API}/v1/sports/team/${p.favourite_team_id}/last`);
      const d = await r.json();
      const last: MatchEvent | undefined = (d.events ?? [])[0];
      if (!last) continue;
      if (last.id === p.last_alerted_event_id) continue; // already alerted

      const msg = buildMessage(p, last);
      // Always advance the marker so we don't re-check the same match forever.
      await supabase.from('profiles').update({ last_alerted_event_id: last.id }).eq('id', p.id);
      if (!msg) continue;

      await supabase.from('notifications').insert({
        user_id: p.id,
        type: 'result',
        title: msg.title,
        body: msg.body,
        url: '/scores',
      });
      // Respect the "Event reminders" toggle — no push when it's off.
      if (p.push_token && p.notify_events !== false) await sendPush(p.push_token, `BETina · ${msg.title}`, msg.body);
      sent++;
    } catch (_e) {
      // one player failing shouldn't stop the batch
    }
  }

  return new Response(JSON.stringify({ ok: true, sent }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
