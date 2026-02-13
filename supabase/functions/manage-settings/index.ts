import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const allowedOrigins = [
  "https://daily-creative-tales.lovable.app",
  "https://id-preview--6ff9ac45-8c6a-457b-b995-7e41546544d0.lovable.app",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

const VALID_ACTIONS = ["load", "save"];

function validateSettings(settings: Record<string, unknown>): string | null {
  if (settings.chat_id !== undefined) {
    if (typeof settings.chat_id !== "string" || settings.chat_id.length > 100) {
      return "chat_id غير صالح";
    }
  }
  if (settings.api_id !== undefined && settings.api_id !== "") {
    if (typeof settings.api_id !== "string" || settings.api_id.length > 20 || !/^\d+$/.test(settings.api_id)) {
      return "api_id يجب أن يكون رقماً";
    }
  }
  if (settings.api_hash !== undefined && settings.api_hash !== "") {
    if (typeof settings.api_hash !== "string" || settings.api_hash.length > 100) {
      return "api_hash غير صالح";
    }
  }
  if (settings.session_string !== undefined && settings.session_string !== "") {
    if (typeof settings.session_string !== "string" || settings.session_string.length > 5000) {
      return "session_string غير صالح";
    }
  }
  if (settings.auto_send_time !== undefined) {
    if (typeof settings.auto_send_time !== "string" || !/^\d{2}:\d{2}(:\d{2})?$/.test(settings.auto_send_time)) {
      return "auto_send_time يجب أن يكون بصيغة HH:MM";
    }
  }
  if (settings.auto_send_enabled !== undefined) {
    if (typeof settings.auto_send_enabled !== "boolean") {
      return "auto_send_enabled يجب أن يكون true أو false";
    }
  }
  return null;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const action = body?.action;

    if (!action || !VALID_ACTIONS.includes(action)) {
      return new Response(
        JSON.stringify({ success: false, error: "إجراء غير صالح" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "load") {
      const { data, error } = await supabase
        .from("telegram_settings")
        .select("id, chat_id, auto_send_enabled, auto_send_time, api_id, api_hash, session_string")
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

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
      const inputSettings = body?.settings;
      if (!inputSettings || typeof inputSettings !== "object") {
        return new Response(
          JSON.stringify({ success: false, error: "لم يتم تقديم إعدادات" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const validationError = validateSettings(inputSettings);
      if (validationError) {
        return new Response(
          JSON.stringify({ success: false, error: validationError }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
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

    return new Response(
      JSON.stringify({ success: false, error: "إجراء غير صالح" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("manage-settings error:", error instanceof Error ? error.message : "Unknown error");
    return new Response(
      JSON.stringify({ success: false, error: "حدث خطأ أثناء معالجة الإعدادات" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
