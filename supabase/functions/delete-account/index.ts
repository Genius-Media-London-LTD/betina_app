// BETina account deletion — Supabase Edge Function (Deno).
//
// Required by Apple App Store Guideline 5.1.1(v) and Google Play: an app that
// lets users create an account must let them delete it (and their data) from
// inside the app. The client calls this with the user's session; we verify the
// JWT, wipe every row that belongs to them, then delete the auth user itself
// (only the service role can do that — never ship the service key in the app).
//
// Deploy:
//   supabase functions deploy delete-account   # JWT verification ON (default)
// (SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are injected.)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...CORS, 'content-type': 'application/json' } });
  }

  try {
    // Identify the caller from their bearer token.
    const authHeader = req.headers.get('Authorization') ?? '';
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401, headers: { ...CORS, 'content-type': 'application/json' } });
    }

    const uid = user.id;
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Wipe all user-owned rows first (explicit — does not rely on FK cascade).
    await admin.from('notifications').delete().eq('user_id', uid);
    await admin.from('reminders').delete().eq('user_id', uid);
    await admin.from('betina_memories').delete().eq('user_id', uid);
    await admin.from('profiles').delete().eq('id', uid);

    // Finally delete the auth user itself.
    const { error: delErr } = await admin.auth.admin.deleteUser(uid);
    if (delErr) {
      return new Response(JSON.stringify({ error: delErr.message }), { status: 500, headers: { ...CORS, 'content-type': 'application/json' } });
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...CORS, 'content-type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...CORS, 'content-type': 'application/json' } });
  }
});
