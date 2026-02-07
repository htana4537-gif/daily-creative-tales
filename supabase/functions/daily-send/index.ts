import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Client } from "jsr:@mtkruto/mtkruto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CHARACTERS = [
  { id: "cleopatra", name: "كليوباترا", nameEn: "Cleopatra" },
  { id: "pharaoh", name: "فرعون", nameEn: "Pharaoh" },
  { id: "nefertiti", name: "نفرتيتي", nameEn: "Nefertiti" },
  { id: "saladin", name: "صلاح الدين", nameEn: "Saladin" },
  { id: "tutankhamun", name: "توت عنخ آمون", nameEn: "Tutankhamun" },
  { id: "hatshepsut", name: "حتشبسوت", nameEn: "Hatshepsut" },
  { id: "ramses", name: "رمسيس الثاني", nameEn: "Ramses II" },
  { id: "harun_rashid", name: "هارون الرشيد", nameEn: "Harun al-Rashid" },
  { id: "ibn_sina", name: "ابن سينا", nameEn: "Ibn Sina" },
  { id: "ibn_khaldun", name: "ابن خلدون", nameEn: "Ibn Khaldun" },
];

const VOICE_TYPES = ["male_arabic", "female_arabic"];
const DURATIONS = [15, 30, 60];

async function sendViaMTKruto(settings: any, message: string) {
  const client = new Client({
    storage: null,
    apiId: Number(settings.api_id),
    apiHash: settings.api_hash,
  });

  await client.importAuthString(settings.session_string);
  await client.start();

  try {
    const chatId = /^-?\d+$/.test(settings.chat_id) ? Number(settings.chat_id) : settings.chat_id;
    await client.sendMessage(chatId, message);
  } finally {
    await client.disconnect();
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Check if auto-send is enabled
    const { data: settings, error: settingsError } = await supabase
      .from("telegram_settings")
      .select("*")
      .limit(1)
      .single();

    if (settingsError || !settings) {
      console.log("No telegram settings found");
      return new Response(
        JSON.stringify({ success: false, message: "لم يتم إعداد الإعدادات" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!settings.auto_send_enabled) {
      console.log("Auto-send is disabled");
      return new Response(
        JSON.stringify({ success: false, message: "الإرسال التلقائي معطل" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!settings.api_id || !settings.api_hash || !settings.session_string) {
      throw new Error("يرجى إدخال بيانات User API في الإعدادات");
    }

    // Pick random values
    const randomChar = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
    const randomVoice = VOICE_TYPES[Math.floor(Math.random() * VOICE_TYPES.length)];
    const randomScenes = Math.floor(Math.random() * 8) + 3;
    const randomDuration = DURATIONS[Math.floor(Math.random() * DURATIONS.length)];

    // Generate creative description using AI
    let description = randomChar.name;
    
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
                content: `أنت كاتب إبداعي متخصص في كتابة أوصاف قصيرة وجذابة للشخصيات التاريخية. 
اكتب وصفاً موجزاً (جملة أو جملتين فقط) بأسلوب شيق ومختلف في كل مرة.
اجعل الوصف يبدو طبيعياً وكأنه مكتوب من شخص عادي، وليس من روبوت.`,
              },
              {
                role: "user",
                content: `اكتب وصفاً قصيراً وإبداعياً للشخصية التاريخية: ${randomChar.name}`,
              },
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          description = aiData.choices?.[0]?.message?.content || randomChar.name;
        }
      } catch (aiError) {
        console.error("AI generation error:", aiError);
      }
    }

    const message = `/create
عنوان: ${randomChar.name}
وصف: ${description}
نوع_الصوت: ${randomVoice}
عدد_المشاهد: ${randomScenes}
الطول: ${randomDuration}`;

    // Send via MTKruto (User API)
    console.log("Sending daily auto-message via User API...");
    await sendViaMTKruto(settings, message);

    // Save to history
    await supabase.from("messages").insert({
      character_name: randomChar.name,
      voice_type: randomVoice,
      scenes_count: randomScenes,
      duration: randomDuration,
      full_message: message,
      status: "auto_sent",
    });

    console.log("Daily auto-message sent successfully:", randomChar.name);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "تم الإرسال التلقائي بنجاح",
        character: randomChar.name 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Daily send error:", error);
    const errorMessage = error instanceof Error ? error.message : "خطأ غير متوقع";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
