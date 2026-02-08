import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Client } from "jsr:@mtkruto/mtkruto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CATEGORIES = [
  { main: "تاريخ", subs: ["شخصية تاريخية", "شخص من الصحابة", "لو شخص من الماضي موجود حالياً", "حدث تاريخي", "دولة تاريخية قديمة"] },
  { main: "رياضة", subs: ["لاعب", "مدرب", "فريق", "حدث مؤثر في كرة القدم"] },
  { main: "قصص", subs: ["قصة للأطفال", "قصة رعب", "قصة حماسية قصيرة"] },
  { main: "علوم", subs: ["معلومات عن جبال", "معلومات عن بحار", "تجارب علمية", "علماء"] },
  { main: "POV", subs: ["أنت في الماضي", "أنت في المستقبل", "أنت في لعبة فيديو"] },
];

const VOICE_TYPES = ["male_arabic", "female_arabic"];
const DURATIONS = [15, 30, 60];

async function sendViaMTKruto(settings: { api_id: string; api_hash: string; session_string: string; chat_id: string }, message: string) {
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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    // Pick random category and subcategory
    const randomCat = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    const randomSub = randomCat.subs[Math.floor(Math.random() * randomCat.subs.length)];
    const randomVoice = VOICE_TYPES[Math.floor(Math.random() * VOICE_TYPES.length)];
    const randomScenes = Math.floor(Math.random() * 8) + 3;
    const randomDuration = DURATIONS[Math.floor(Math.random() * DURATIONS.length)];

    // Get used titles
    const { data: prevMessages } = await supabase
      .from("messages")
      .select("character_name")
      .order("sent_at", { ascending: false })
      .limit(500);
    const usedTitles = (prevMessages || []).map((m: any) => m.character_name);
    const usedTitlesText = usedTitles.length > 0
      ? `\n\nالعناوين المستخدمة سابقاً (لا تكررها أبداً):\n${usedTitles.join("\n")}`
      : "";

    let title = `${randomCat.main} - ${randomSub}`;
    let description = title;

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
                content: `أنت كاتب محتوى إبداعي. مهمتك:
1. اختر عنواناً محدداً وفريداً بناءً على النوع والموضوع الفرعي المحدد. العنوان يجب أن يكون اسم شيء محدد (مثل اسم شخصية، اسم حدث، اسم مكان، إلخ) وليس عنواناً عاماً.
2. اكتب وصفاً موجزاً (جملة أو جملتين) يركز على شيء واحد أو موقف واحد محدد بناءً على العنوان.
3. اجعل الأسلوب طبيعياً وشيقاً.

أجب بالتنسيق التالي فقط بدون أي شيء إضافي:
عنوان: [العنوان]
وصف: [الوصف]${usedTitlesText}`,
              },
              {
                role: "user",
                content: `النوع الرئيسي: ${randomCat.main}\nالموضوع الفرعي: ${randomSub}\n\nاختر عنواناً محدداً وفريداً واكتب وصفاً مركزاً عليه.`,
              },
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content || "";
          
          const titleMatch = content.match(/عنوان:\s*(.+)/);
          const descMatch = content.match(/وصف:\s*(.+)/);
          
          if (titleMatch) title = titleMatch[1].trim();
          if (descMatch) description = descMatch[1].trim();
        }
      } catch (aiError) {
        console.error("AI generation error:", aiError);
      }
    }

    const message = `/create
عنوان: ${title}
وصف: ${description}
نوع_الصوت: ${randomVoice}
عدد_المشاهد: ${randomScenes}
الطول: ${randomDuration}`;

    console.log("Sending daily auto-message via User API...");
    await sendViaMTKruto(settings as any, message);

    await supabase.from("messages").insert({
      character_name: title,
      voice_type: randomVoice,
      scenes_count: randomScenes,
      duration: randomDuration,
      full_message: message,
      status: "auto_sent",
    });

    console.log("Daily auto-message sent successfully:", title);

    return new Response(
      JSON.stringify({ success: true, message: "تم الإرسال التلقائي بنجاح", character: title }),
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
