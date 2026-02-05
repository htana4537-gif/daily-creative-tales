import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CHARACTERS: Record<string, { name: string; nameEn: string }> = {
  cleopatra: { name: "كليوباترا", nameEn: "Cleopatra" },
  pharaoh: { name: "فرعون", nameEn: "Pharaoh" },
  nefertiti: { name: "نفرتيتي", nameEn: "Nefertiti" },
  saladin: { name: "صلاح الدين", nameEn: "Saladin" },
  tutankhamun: { name: "توت عنخ آمون", nameEn: "Tutankhamun" },
  hatshepsut: { name: "حتشبسوت", nameEn: "Hatshepsut" },
  ramses: { name: "رمسيس الثاني", nameEn: "Ramses II" },
  harun_rashid: { name: "هارون الرشيد", nameEn: "Harun al-Rashid" },
  ibn_sina: { name: "ابن سينا", nameEn: "Ibn Sina" },
  ibn_khaldun: { name: "ابن خلدون", nameEn: "Ibn Khaldun" },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { character, voiceType, scenesCount, duration } = await req.json();

    // Get Telegram settings
    const { data: settings, error: settingsError } = await supabase
      .from("telegram_settings")
      .select("*")
      .limit(1)
      .single();

    if (settingsError || !settings) {
      throw new Error("يرجى إعداد إعدادات تلجرام أولاً");
    }

    const charData = CHARACTERS[character] || { name: character, nameEn: character };

    // Generate description using AI
    let description = charData.name;
    
    if (LOVABLE_API_KEY) {
      try {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              {
                role: "system",
                content: "أنت كاتب إبداعي متخصص في كتابة أوصاف قصيرة وجذابة للشخصيات التاريخية. اكتب وصفاً موجزاً (جملة أو جملتين فقط) بأسلوب شيق ومختلف في كل مرة.",
              },
              {
                role: "user",
                content: `اكتب وصفاً قصيراً وإبداعياً للشخصية التاريخية: ${charData.name}`,
              },
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          description = aiData.choices?.[0]?.message?.content || charData.name;
        }
      } catch (aiError) {
        console.error("AI generation error:", aiError);
      }
    }

    // Build the message
    const message = `/create

عنوان: ${charData.name}

وصف: ${description}

نوع_الصوت: ${voiceType}

عدد_المشاهد: ${scenesCount}

الطول: ${duration}`;

    // Send to Telegram
    const telegramUrl = `https://api.telegram.org/bot${settings.bot_token}/sendMessage`;
    const telegramResponse = await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: settings.chat_id,
        text: message,
        parse_mode: "HTML",
      }),
    });

    const telegramResult = await telegramResponse.json();

    if (!telegramResult.ok) {
      throw new Error(telegramResult.description || "فشل إرسال الرسالة إلى تلجرام");
    }

    // Save to history
    await supabase.from("messages").insert({
      character_name: charData.name,
      voice_type: voiceType,
      scenes_count: scenesCount,
      duration: duration,
      full_message: message,
      status: "sent",
    });

    console.log("Message sent successfully to Telegram");

    return new Response(
      JSON.stringify({ success: true, message: "تم الإرسال بنجاح" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "خطأ غير متوقع";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
