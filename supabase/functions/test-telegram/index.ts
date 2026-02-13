import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Client } from "jsr:@mtkruto/mtkruto";

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

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: settings, error: settingsError } = await supabase
      .from("telegram_settings")
      .select("api_id, api_hash, session_string, chat_id")
      .limit(1)
      .single();

    if (settingsError || !settings) {
      throw new Error("لم يتم العثور على الإعدادات. يرجى حفظ الإعدادات أولاً");
    }

    if (!settings.api_id || !settings.api_hash || !settings.session_string || !settings.chat_id) {
      throw new Error("يرجى إدخال جميع البيانات المطلوبة وحفظها أولاً");
    }

    const client = new Client({
      storage: null,
      apiId: Number(settings.api_id),
      apiHash: settings.api_hash,
    });

    await client.importAuthString(settings.session_string);
    await client.start();

    const testMessage = "✅ رسالة اختبار من مُنشئ المحتوى اليومي\n\nتم إعداد الاتصال بنجاح!";

    try {
      const parsedChatId = /^-?\d+$/.test(settings.chat_id) ? Number(settings.chat_id) : settings.chat_id;
      await client.sendMessage(parsedChatId, testMessage);
    } finally {
      await client.disconnect();
    }

    console.log("Test message sent successfully via User API");

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Test error:", error instanceof Error ? error.message : "Unknown error");
    return new Response(
      JSON.stringify({ success: false, error: "حدث خطأ أثناء اختبار الاتصال" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
