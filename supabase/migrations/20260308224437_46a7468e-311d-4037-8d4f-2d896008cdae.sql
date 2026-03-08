-- Enable pg_net extension
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule daily-send cron job using pg_cron (already enabled)
SELECT cron.schedule(
  'daily-auto-send',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://fborsqajwdtjzvwgwppy.supabase.co/functions/v1/daily-send',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZib3JzcWFqd2R0anp2d2d3cHB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyOTI0NzIsImV4cCI6MjA4NTg2ODQ3Mn0.Shk4TPPP7kElggdg3wSfu-8BJJWIPN-z9wWREtPdx3E"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
