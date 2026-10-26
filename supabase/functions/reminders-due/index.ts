// BETina reminder delivery — Supabase Edge Function (Deno).
//
// Runs on a schedule (e.g. every 5 min). Finds reminders whose time has come,
// writes a BETina notification (shows in-app) + sends a push, and marks them
// sent. Pair with the match-alerts function.
//
// Deploy:
//   supabase functions deploy reminders-due --no-verify-jwt
// Schedule (SQL, once):
//   select cron.schedule('reminders-due', '*/5 * * * *',
//     $$ select net.http_post(
//          url := 'https://<project>.functions.supabase.co/reminders-due',
//          headers := jsonb_build_object('Authorization','Bearer <SERVICE_ROLE_KEY>')
//        ) $$);
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendSms } from '../_shared/sms.ts';

const EXPO_PUSH = 'https://exp.host/--/api/v2/push/send';

type Reminder = {
  id: string;
  user_id: string;
  text: string;
  remind_at: string;
};

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

  const nowIso = new Date().toISOString();
  const { data: due } = await supabase
    .from('reminders')
    .select('id, user_id, text, remind_at')
    .eq('sent', false)
    .lte('remind_at', nowIso)
    .limit(100);

  let sent = 0;

  for (const rem of (due ?? []) as Reminder[]) {
    try {
      // Mark sent first so a retry can't double-fire.
      await supabase.from('reminders').update({ sent: true }).eq('id', rem.id);

      await supabase.from('notifications').insert({
        user_id: rem.user_id,
        type: 'betina',
        title: 'BETina reminder',
        body: rem.text,
        url: '/chat',
      });

      const { data: profile } = await supabase
        .from('profiles')
        .select('push_token, phone_normalized, phone, notify_betina')
        .eq('id', rem.user_id)
        .maybeSingle();

      // Respect the "BETina messages" toggle — no push/SMS when it's off
      // (the in-app notification above is still recorded).
      if (profile?.notify_betina !== false) {
        if (profile?.push_token) {
          await sendPush(profile.push_token, 'BETina 💬', rem.text);
        } else {
          const smsPhone = profile?.phone_normalized ?? profile?.phone ?? null;
          if (smsPhone) await sendSms(smsPhone, `BETina 💬 ${rem.text}`);
        }
      }
      sent++;
    } catch (_e) {
      // one reminder failing shouldn't stop the batch
    }
  }

  return new Response(JSON.stringify({ ok: true, sent }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
