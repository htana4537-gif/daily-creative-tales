ALTER TABLE public.telegram_settings
  ADD COLUMN IF NOT EXISTS preferred_categories jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS preferred_voice text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS preferred_scenes_min integer DEFAULT 5,
  ADD COLUMN IF NOT EXISTS preferred_scenes_max integer DEFAULT 25,
  ADD COLUMN IF NOT EXISTS preferred_duration integer DEFAULT NULL;