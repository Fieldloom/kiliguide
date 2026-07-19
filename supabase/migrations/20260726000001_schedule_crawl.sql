-- Enable pg_cron extension (must be enabled in Supabase Dashboard -> Extensions first)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the crawl-sitemap function to run every day at 2:00 AM UTC
-- NOTE: This requires pg_cron to be enabled and the SUPABASE_URL / SERVICE_ROLE_KEY
-- to be available. Run the function directly from the Dashboard to test first.
--
-- SELECT cron.schedule(
--   'kiliguide-daily-crawl',   -- unique job name
--   '0 2 * * *',               -- cron expression: 2:00 AM every day
--   $$
--     SELECT net.http_post(
--       url := current_setting('app.supabase_url') || '/functions/v1/crawl-sitemap',
--       headers := jsonb_build_object(
--         'Content-Type', 'application/json',
--         'Authorization', 'Bearer ' || current_setting('app.service_role_key')
--       ),
--       body := '{"triggered_by": "pg_cron"}'::jsonb
--     );
--   $$
-- );

-- ================================================================
-- ALTERNATIVE: Use Supabase's built-in Edge Function scheduler
-- In your Supabase Dashboard > Edge Functions > crawl-sitemap
-- Set a schedule of "0 2 * * *" in the function settings UI.
-- This is the recommended approach and requires no SQL.
-- ================================================================

-- Mark the crawl schedule as configured
COMMENT ON TABLE public.crawl_queue IS 
  'Tracks all URLs discovered from sitemaps and their ingestion status. Crawl is triggered daily by a Supabase Edge Function schedule.';
