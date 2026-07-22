-- Enable pg_cron if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Removed unschedule as it crashes if job does not exist

-- Schedule the edge function to run every minute
SELECT cron.schedule(
  'dispatch-alarms',
  '* * * * *',
  $$
    SELECT net.http_post(
      url:='https://jxspwvfxugckztzuogot.supabase.co/functions/v1/dispatch-event-reminders',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer sb_publishable_MnVXXp1zVEy2vzVK2x-v1g_XRIAr5-C"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);
