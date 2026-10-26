-- BETina Live goal pushes go live (Dejan's go, 2026-10-26): live-alerts runs
-- every 30 seconds (pg_cron interval syntax). See migration 021.
select cron.unschedule('live-alerts') where exists (select 1 from cron.job where jobname = 'live-alerts');
select cron.schedule('live-alerts', '30 seconds',
  $$ select net.http_post(
       url := 'https://djnmrvhdklpclbrhxxqs.functions.supabase.co/live-alerts',
       headers := '{"Content-Type":"application/json"}'::jsonb,
       body := '{}'::jsonb,
       timeout_milliseconds := 25000) $$);
