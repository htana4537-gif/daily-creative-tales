ALTER TABLE public.telegram_settings 
ADD COLUMN IF NOT EXISTS auto_send_count integer NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS auto_send_frequency text NOT NULL DEFAULT 'daily',
ADD COLUMN IF NOT EXISTS auto_send_sent_today integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS auto_send_last_date date;