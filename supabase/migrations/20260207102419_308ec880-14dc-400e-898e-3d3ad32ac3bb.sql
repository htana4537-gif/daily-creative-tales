
-- Add User API columns to telegram_settings
ALTER TABLE public.telegram_settings 
  ADD COLUMN api_id text,
  ADD COLUMN api_hash text,
  ADD COLUMN session_string text;

-- Make bot_token nullable (since we're switching to user API)
ALTER TABLE public.telegram_settings 
  ALTER COLUMN bot_token DROP NOT NULL,
  ALTER COLUMN bot_token SET DEFAULT '';
