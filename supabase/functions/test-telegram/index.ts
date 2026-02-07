import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Client } from "jsr:@mtkruto/mtkruto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { apiId, apiHash, sessionString, chatId } = await req.json();

    if (!apiId || !apiHash || !sessionString || !chatId) {
      throw new Error("يرجى إدخال جميع البيانات المطلوبة");
    }

    const client = new Client({
      storage: null,
      apiId: Number(apiId),
      apiHash: apiHash,
    });

    await client.importAuthString(sessionString);
    await client.start();

    const testMessage = "✅ رسالة اختبار من مُنشئ المحتوى اليومي\n\nتم إعداد الاتصال بنجاح!";

    try {
      await client.sendMessage(chatId, testMessage);
    } finally {
      await client.disconnect();
    }

    console.log("Test message sent successfully via User API");

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Test error:", error);
    const errorMessage = error instanceof Error ? error.message : "خطأ في الاختبار";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
