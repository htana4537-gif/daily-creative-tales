import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, settings: inputSettings } = await req.json();

    if (action === "load") {
      const { data, error } = await supabase
        .from("telegram_settings")
        .select("id, chat_id, auto_send_enabled, auto_send_time, api_id, api_hash, session_string")
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      // Return settings but mask sensitive fields
      if (data) {
        return new Response(
          JSON.stringify({
            success: true,
            settings: {
              id: data.id,
              chat_id: data.chat_id,
              auto_send_enabled: data.auto_send_enabled,
              auto_send_time: data.auto_send_time,
              has_api_id: !!data.api_id,
              has_api_hash: !!data.api_hash,
              has_session_string: !!data.session_string,
            },
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, settings: null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "save") {
      if (!inputSettings) {
        throw new Error("No settings provided");
      }

      const { data: existing } = await supabase
        .from("telegram_settings")
        .select("id")
        .limit(1)
        .single();

      const settingsToSave: Record<string, unknown> = {
        chat_id: inputSettings.chat_id,
        auto_send_enabled: inputSettings.auto_send_enabled,
        auto_send_time: inputSettings.auto_send_time,
        bot_token: "",
      };

      // Only update sensitive fields if provided (non-empty)
      if (inputSettings.api_id) settingsToSave.api_id = inputSettings.api_id;
      if (inputSettings.api_hash) settingsToSave.api_hash = inputSettings.api_hash;
      if (inputSettings.session_string) settingsToSave.session_string = inputSettings.session_string;

      if (existing) {
        const { error } = await supabase
          .from("telegram_settings")
          .update(settingsToSave)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("telegram_settings")
          .insert(settingsToSave);
        if (error) throw error;
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error("Invalid action");
  } catch (error: unknown) {
    console.error("manage-settings error:", error);
    const errorMessage = error instanceof Error ? error.message : "خطأ غير متوقع";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
