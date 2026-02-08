
-- Drop all existing permissive policies on telegram_settings
DROP POLICY IF EXISTS "Allow public read on settings" ON public.telegram_settings;
DROP POLICY IF EXISTS "Allow public insert on settings" ON public.telegram_settings;
DROP POLICY IF EXISTS "Allow public update on settings" ON public.telegram_settings;

-- Drop all existing permissive policies on messages
DROP POLICY IF EXISTS "Allow public read on messages" ON public.messages;
DROP POLICY IF EXISTS "Allow public insert on messages" ON public.messages;

-- Deny all direct public access to telegram_settings (edge functions use service role)
CREATE POLICY "Deny all direct access to settings"
ON public.telegram_settings FOR ALL
USING (false)
WITH CHECK (false);

-- Deny all direct public access to messages (edge functions use service role)
CREATE POLICY "Deny all direct access to messages"
ON public.messages FOR ALL
USING (false)
WITH CHECK (false);
