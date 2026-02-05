-- Create settings table for Telegram configuration
CREATE TABLE public.telegram_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_token TEXT NOT NULL,
  chat_id TEXT NOT NULL,
  auto_send_enabled BOOLEAN NOT NULL DEFAULT false,
  auto_send_time TIME NOT NULL DEFAULT '09:00:00',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create messages history table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  character_name TEXT NOT NULL,
  voice_type TEXT NOT NULL,
  scenes_count INTEGER NOT NULL,
  duration INTEGER NOT NULL,
  full_message TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'sent'
);

-- Enable RLS
ALTER TABLE public.telegram_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Public access policies (single user app)
CREATE POLICY "Allow public read on settings" 
ON public.telegram_settings FOR SELECT USING (true);

CREATE POLICY "Allow public insert on settings" 
ON public.telegram_settings FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on settings" 
ON public.telegram_settings FOR UPDATE USING (true);

CREATE POLICY "Allow public read on messages" 
ON public.messages FOR SELECT USING (true);

CREATE POLICY "Allow public insert on messages" 
ON public.messages FOR INSERT WITH CHECK (true);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;