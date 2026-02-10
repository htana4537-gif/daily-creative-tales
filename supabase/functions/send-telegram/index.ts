import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Client } from "jsr:@mtkruto/mtkruto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CATEGORY_LABELS: Record<string, string> = {
  history: "تاريخ",
  sports: "رياضة",
  stories: "قصص",
  science: "علوم",
  pov: "POV",
  oddities: "غرائب وعجائب",
  technology: "تقنية",
  geography: "جغرافيا وسفر",
  psychology: "نفسية وتطوير ذات",
};

const SUBCATEGORY_LABELS: Record<string, string> = {
  // تاريخ
  historical_figure: "شخصية تاريخية",
  companion: "شخص من الصحابة",
  past_in_present: "لو شخص من الماضي موجود حالياً",
  historical_event: "حدث تاريخي",
  ancient_nation: "دولة تاريخية قديمة",
  historical_battle: "معركة تاريخية",
  world_changing_invention: "اختراع غيّر العالم",
  lost_civilization: "حضارة مفقودة",
  // رياضة
  player: "لاعب",
  coach: "مدرب",
  team: "فريق",
  football_event: "حدث مؤثر في كرة القدم",
  legendary_stadium: "ملعب أسطوري",
  shocking_transfer: "انتقال صادم",
  historic_derby: "ديربي تاريخي",
  world_record: "رقم قياسي",
  // قصص
  children_story: "قصة للأطفال",
  horror_story: "قصة رعب",
  short_action: "قصة حماسية قصيرة",
  mystery_story: "قصة غموض",
  scifi_story: "قصة خيال علمي",
  survival_story: "قصة بقاء",
  folk_legend: "أسطورة شعبية",
  true_horror: "قصة حقيقية مرعبة",
  // علوم
  mountains: "معلومات عن جبال",
  seas: "معلومات عن بحار",
  experiments: "تجارب علمية",
  scientists: "علماء",
  space_planets: "الفضاء والكواكب",
  strange_animals: "حيوانات غريبة",
  human_body: "جسم الإنسان",
  natural_disasters: "كوارث طبيعية",
  // POV
  pov_past: "أنت في الماضي",
  pov_future: "أنت في المستقبل",
  pov_videogame: "أنت في لعبة فيديو",
  pov_horror_movie: "أنت في فيلم رعب",
  pov_deserted_island: "أنت على جزيرة مهجورة",
  pov_space: "أنت في الفضاء",
  pov_last_person: "أنت آخر شخص على الأرض",
  pov_parallel_world: "أنت في عالم موازي",
  // غرائب وعجائب
  mysterious_place: "مكان غامض",
  unexplained_phenomenon: "ظاهرة غير مفسرة",
  mythical_creature: "مخلوق أسطوري",
  conspiracy_theory: "نظرية مؤامرة",
  mysterious_disappearance: "اختفاء غامض",
  strange_laws: "أغرب القوانين",
  unbelievable_coincidence: "صدفة لا تُصدّق",
  abandoned_city: "مدينة مهجورة",
  // تقنية
  world_changing_app: "تطبيق غيّر العالم",
  amazing_robot: "روبوت مذهل",
  ai_achievement: "ذكاء اصطناعي",
  failed_invention: "اختراع فاشل",
  future_tech: "مستقبل التقنية",
  tech_company_story: "قصة شركة تقنية",
  legendary_videogame: "ألعاب فيديو أسطورية",
  famous_hacker: "هاكر شهير",
  // جغرافيا وسفر
  beautiful_city: "أجمل مدينة",
  dangerous_road: "أخطر طريق",
  strange_island: "جزيرة غريبة",
  architectural_wonder: "عجائب معمارية",
  unique_people: "شعب فريد",
  deepest_cave: "أعمق كهف",
  strange_borders: "حدود غريبة",
  smallest_country: "أصغر دولة",
  // نفسية وتطوير ذات
  psychological_trick: "خدعة نفسية",
  famous_experiment: "تجربة نفسية شهيرة",
  body_language: "لغة الجسد",
  success_habit: "عادة ناجحين",
  psychological_effect: "أثر نفسي",
  common_myth: "خرافة شائعة",
  inspiring_success: "قصة نجاح ملهمة",
  art_of_persuasion: "فن الإقناع",
};

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

async function getUsedTitles(supabase: any): Promise<string[]> {
  const { data } = await supabase
    .from("messages")
    .select("character_name")
    .order("sent_at", { ascending: false })
    .limit(500);
  return (data || []).map((m: any) => m.character_name);
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

    const { mainCategory, subCategory, voiceType, scenesCount, duration } = await req.json();

    // Get Telegram settings
    const { data: settings, error: settingsError } = await supabase
      .from("telegram_settings")
      .select("*")
      .limit(1)
      .single();

    if (settingsError || !settings) {
      throw new Error("يرجى إعداد إعدادات تلجرام أولاً");
    }

    if (!settings.api_id || !settings.api_hash || !settings.session_string) {
      throw new Error("يرجى إدخال API ID و API Hash و Session String في الإعدادات");
    }

    const categoryName = CATEGORY_LABELS[mainCategory] || mainCategory;
    const subCategoryName = SUBCATEGORY_LABELS[subCategory] || subCategory;

    // Get previously used titles to avoid repeats
    const usedTitles = await getUsedTitles(supabase);
    const usedTitlesText = usedTitles.length > 0
      ? `\n\nالعناوين المستخدمة سابقاً (لا تكررها أبداً):\n${usedTitles.join("\n")}`
      : "";

    let title = `${categoryName} - ${subCategoryName}`;
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
                content: `النوع الرئيسي: ${categoryName}\nالموضوع الفرعي: ${subCategoryName}\n\nاختر عنواناً محدداً وفريداً واكتب وصفاً مركزاً عليه.`,
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
نوع_الصوت: ${voiceType}
عدد_المشاهد: ${scenesCount}
الطول: ${duration}`;

    console.log("Sending message via User API (MTKruto)...");
    await sendViaMTKruto(settings as any, message);

    // Save to history
    await supabase.from("messages").insert({
      character_name: title,
      voice_type: voiceType,
      scenes_count: scenesCount,
      duration: duration,
      full_message: message,
      status: "sent",
    });

    console.log("Message sent successfully:", title);

    return new Response(
      JSON.stringify({ success: true, message: "تم الإرسال بنجاح", title }),
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
