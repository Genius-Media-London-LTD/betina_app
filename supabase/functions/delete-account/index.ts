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

// Sign in with Apple: Apple requires revoking the player's Apple tokens when the
// account is deleted. The app sends a fresh authorization code; we trade it for a
// token and revoke that. Secrets from a "Sign in with Apple" key (.p8) in the
// Apple developer account. Best effort — never blocks the deletion itself.
const APPLE_TEAM_ID = Deno.env.get('APPLE_TEAM_ID') ?? '';
const APPLE_KEY_ID = Deno.env.get('APPLE_KEY_ID') ?? '';
// The .p8 key may be stored with literal "\n" instead of line breaks; the PEM
// markers and whitespace are stripped anyway.
const APPLE_PRIVATE_KEY = (Deno.env.get('APPLE_PRIVATE_KEY') ?? '').replace(/\\n/g, '\n');
const APPLE_CLIENT_ID = Deno.env.get('APPLE_CLIENT_ID') ?? 'com.geniusbet.betina';

const b64url = (data: Uint8Array | string) =>
  btoa(typeof data === 'string' ? data : String.fromCharCode(...data))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/** Short-lived ES256 client secret Apple wants on /auth/token and /auth/revoke. */
async function appleClientSecret(): Promise<string> {
  const pem = APPLE_PRIVATE_KEY.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('pkcs8', der, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({ alg: 'ES256', kid: APPLE_KEY_ID }));
  const claims = b64url(JSON.stringify({
    iss: APPLE_TEAM_ID, iat: now, exp: now + 300, aud: 'https://appleid.apple.com', sub: APPLE_CLIENT_ID,
  }));
  // WebCrypto returns the raw r||s signature, which is what JWS ES256 expects.
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(`${head}.${claims}`));
  return `${head}.${claims}.${b64url(new Uint8Array(sig))}`;
}

async function revokeApple(code: string): Promise<void> {
  if (!APPLE_TEAM_ID || !APPLE_KEY_ID || !APPLE_PRIVATE_KEY) {
    console.warn('apple revoke skipped: APPLE_* secrets not set');
    return;
  }
  const secret = await appleClientSecret();
  const post = (path: string, form: Record<string, string>) =>
    fetch(`https://appleid.apple.com/auth/${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: APPLE_CLIENT_ID, client_secret: secret, ...form }),
    });
  const res = await post('token', { code, grant_type: 'authorization_code' });
  const tok = await res.json().catch(() => ({}));
  const token = tok.refresh_token ?? tok.access_token;
  if (!token) {
    console.warn('apple token exchange failed:', res.status, tok.error);
    return;
  }
  const rev = await post('revoke', { token, token_type_hint: tok.refresh_token ? 'refresh_token' : 'access_token' });
  if (!rev.ok) console.warn('apple revoke failed:', rev.status);
}

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

    const body = await req.json().catch(() => ({}));
    if (typeof body?.apple_code === 'string' && body.apple_code) {
      await revokeApple(body.apple_code).catch((e) => console.warn('apple revoke error:', e));
    }

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
