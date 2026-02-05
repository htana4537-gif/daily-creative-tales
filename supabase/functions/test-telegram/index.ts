import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { botToken, chatId } = await req.json();

    if (!botToken || !chatId) {
      throw new Error("يرجى إدخال Bot Token و Chat ID");
    }

    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const testMessage = "✅ رسالة اختبار من مُنشئ المحتوى اليومي\n\nتم إعداد الاتصال بنجاح!";

    const response = await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: testMessage,
      }),
    });

    const result = await response.json();

    if (!result.ok) {
      console.error("Telegram API error:", result);
      throw new Error(result.description || "فشل الاتصال بتلجرام");
    }

    console.log("Test message sent successfully");

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
