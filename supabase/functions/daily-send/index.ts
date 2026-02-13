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
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

const CATEGORIES = [
  { main: "تاريخ", subs: ["شخصية تاريخية", "شخص من الصحابة", "لو شخص من الماضي موجود حالياً", "حدث تاريخي", "دولة تاريخية قديمة", "معركة تاريخية", "اختراع غيّر العالم", "حضارة مفقودة"] },
  { main: "رياضة", subs: ["لاعب", "مدرب", "فريق", "حدث مؤثر في كرة القدم", "ملعب أسطوري", "انتقال صادم", "ديربي تاريخي", "رقم قياسي"] },
  { main: "قصص", subs: ["قصة للأطفال", "قصة رعب", "قصة حماسية قصيرة", "قصة غموض", "قصة خيال علمي", "قصة بقاء", "أسطورة شعبية", "قصة حقيقية مرعبة"] },
  { main: "علوم", subs: ["معلومات عن جبال", "معلومات عن بحار", "تجارب علمية", "علماء", "الفضاء والكواكب", "حيوانات غريبة", "جسم الإنسان", "كوارث طبيعية"] },
  { main: "POV", subs: ["أنت في الماضي", "أنت في المستقبل", "أنت في لعبة فيديو", "أنت في فيلم رعب", "أنت على جزيرة مهجورة", "أنت في الفضاء", "أنت آخر شخص على الأرض", "أنت في عالم موازي"] },
  { main: "غرائب وعجائب", subs: ["مكان غامض", "ظاهرة غير مفسرة", "مخلوق أسطوري", "نظرية مؤامرة", "اختفاء غامض", "أغرب القوانين", "صدفة لا تُصدّق", "مدينة مهجورة"] },
  { main: "تقنية", subs: ["تطبيق غيّر العالم", "روبوت مذهل", "ذكاء اصطناعي", "اختراع فاشل", "مستقبل التقنية", "قصة شركة تقنية", "ألعاب فيديو أسطورية", "هاكر شهير"] },
  { main: "جغرافيا وسفر", subs: ["أجمل مدينة", "أخطر طريق", "جزيرة غريبة", "عجائب معمارية", "شعب فريد", "أعمق كهف", "حدود غريبة", "أصغر دولة"] },
  { main: "نفسية وتطوير ذات", subs: ["خدعة نفسية", "تجربة نفسية شهيرة", "لغة الجسد", "عادة ناجحين", "أثر نفسي", "خرافة شائعة", "قصة نجاح ملهمة", "فن الإقناع"] },
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
  const corsHeaders = getCorsHeaders(req);

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

    const randomCat = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    const randomSub = randomCat.subs[Math.floor(Math.random() * randomCat.subs.length)];
    const randomVoice = VOICE_TYPES[Math.floor(Math.random() * VOICE_TYPES.length)];
    const randomScenes = Math.floor(Math.random() * 8) + 3;
    const randomDuration = DURATIONS[Math.floor(Math.random() * DURATIONS.length)];

    const { data: prevMessages } = await supabase
      .from("messages")
      .select("character_name")
      .order("sent_at", { ascending: false })
      .limit(50);
    const usedTitles = (prevMessages || []).map((m: any) => 
      String(m.character_name || "").replace(/[\n\r]/g, ' ').substring(0, 200).trim()
    );
    const usedTitlesText = usedTitles.length > 0
      ? `\n\nقائمة العناوين المستخدمة سابقاً:\n${usedTitles.map(t => `- ${t}`).join("\n")}`
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
          
          if (titleMatch) title = titleMatch[1].replace(/[\n\r]/g, ' ').substring(0, 200).trim();
          if (descMatch) description = descMatch[1].replace(/[\n\r]/g, ' ').substring(0, 500).trim();
        }
      } catch (aiError) {
        console.error("AI generation error:", aiError instanceof Error ? aiError.message : "Unknown error");
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
    console.error("Daily send error:", error instanceof Error ? error.message : "Unknown error");
    return new Response(
      JSON.stringify({ success: false, error: "حدث خطأ أثناء الإرسال التلقائي" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
