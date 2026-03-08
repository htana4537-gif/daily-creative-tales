import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Client } from "jsr:@mtkruto/mtkruto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

const CATEGORY_ID_TO_NAME: Record<string, string> = {
  history: "تاريخ", sports: "رياضة", stories: "قصص", science: "علوم", pov: "POV",
  oddities: "غرائب وعجائب", technology: "تقنية", geography: "جغرافيا وسفر", psychology: "نفسية وتطوير ذات",
};

const VOICE_TYPES = ["male_arabic", "female_arabic"];
const DURATIONS = [15, 30, 60];

async function sendViaMTKruto(settings: { api_id: string; api_hash: string; session_string: string; chat_id: string }, message: string) {
  const client = new Client({
    apiId: Number(settings.api_id),
    apiHash: settings.api_hash,
  } as any);

  await client.importAuthString(settings.session_string);
  await client.start();

  try {
    const chatId = /^-?\d+$/.test(settings.chat_id) ? Number(settings.chat_id) : settings.chat_id;
    await client.sendMessage(chatId, message);
  } finally {
    await client.disconnect();
  }
}

async function verifyAuth(req: Request, supabaseUrl: string, supabaseAnonKey: string): Promise<boolean> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;

  const token = authHeader.replace("Bearer ", "");

  // Check if it's the service role key (for cron/scheduled calls)
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (serviceRoleKey && token === serviceRoleKey) {
    console.log("Authenticated via service role key (cron/scheduled)");
    return true;
  }

  // Check if it's the anon key (for pg_cron calls)
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (anonKey && token === anonKey) {
    console.log("Authenticated via anon key (cron/scheduled)");
    return true;
  }

  // Otherwise verify as user JWT
  try {
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) return false;
    return true;
  } catch {
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    // Auth check - accepts both user JWT and service role key
    const isAuthed = await verifyAuth(req, supabaseUrl, supabaseAnonKey);
    if (!isAuthed) {
      return new Response(JSON.stringify({ success: false, error: "غير مصرح" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: settings, error: settingsError } = await supabase
      .from("telegram_settings")
      .select("*")
      .limit(1)
      .single();

    if (settingsError || !settings) {
      console.error("Settings not found:", settingsError?.message);
      return new Response(
        JSON.stringify({ success: false, message: "لم يتم إعداد الإعدادات" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!settings.auto_send_enabled) {
      console.log("Auto-send is disabled, skipping");
      return new Response(
        JSON.stringify({ success: false, message: "الإرسال التلقائي معطل" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!settings.api_id || !settings.api_hash || !settings.session_string) {
      throw new Error("يرجى إدخال بيانات User API في الإعدادات");
    }

    // Log all preferences for debugging
    console.log("=== Auto-send preferences ===");
    console.log("preferred_categories:", JSON.stringify(settings.preferred_categories));
    console.log("preferred_voice:", settings.preferred_voice);
    console.log("preferred_scenes_min:", settings.preferred_scenes_min);
    console.log("preferred_scenes_max:", settings.preferred_scenes_max);
    console.log("preferred_duration:", settings.preferred_duration);

    // Use preferred categories or fall back to all
    const preferredCats: string[] = Array.isArray(settings.preferred_categories) && settings.preferred_categories.length > 0
      ? settings.preferred_categories
      : [];

    let filteredCategories = CATEGORIES;
    if (preferredCats.length > 0) {
      const preferredNames = preferredCats.map((id: string) => CATEGORY_ID_TO_NAME[id]).filter(Boolean);
      console.log("Filtered category names:", JSON.stringify(preferredNames));
      if (preferredNames.length > 0) {
        filteredCategories = CATEGORIES.filter(c => preferredNames.includes(c.main));
      }
    }

    console.log("Using categories:", filteredCategories.map(c => c.main).join(", "));

    const randomCat = filteredCategories[Math.floor(Math.random() * filteredCategories.length)];
    const randomSub = randomCat.subs[Math.floor(Math.random() * randomCat.subs.length)];

    // Use preferred voice or random
    const randomVoice = settings.preferred_voice && VOICE_TYPES.includes(settings.preferred_voice)
      ? settings.preferred_voice
      : VOICE_TYPES[Math.floor(Math.random() * VOICE_TYPES.length)];

    // Use preferred scenes range or defaults
    const scenesMin = settings.preferred_scenes_min ?? 5;
    const scenesMax = settings.preferred_scenes_max ?? 25;
    const randomScenes = Math.floor(Math.random() * (scenesMax - scenesMin + 1)) + scenesMin;

    // Use preferred duration or random
    const randomDuration = settings.preferred_duration && DURATIONS.includes(settings.preferred_duration)
      ? settings.preferred_duration
      : DURATIONS[Math.floor(Math.random() * DURATIONS.length)];

    console.log(`Selected: category=${randomCat.main}, sub=${randomSub}, voice=${randomVoice}, scenes=${randomScenes}, duration=${randomDuration}`);

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
            model: "google/gemini-2.5-flash",
            messages: [
              {
                role: "system",
                content: `أنت خبير في صياغة المحتوى الفيروسي (Viral Content Architect) وصائد للقصص الغامضة. مهمتك هي استخراج "اللحظة الأكثر إثارة" وتحويلها إلى فكرة فيديو.

القواعد الذهبية:

1. العنوان (اسم الشيء): يجب أن يكون اسم "كيان محدد" (اسم شخصية نادرة، قطعة أثرية، حدث غامض، أو مكان مجهول). ممنوع تماماً العناوين العامة (مثال: بدلاً من "الأهرامات"، استخدم "الغرفة المفقودة تحت مخالب أبو الهول").

2. الوصف (اللقطة الفاصلة): اكتب جملة واحدة مكثفة تركز على "موقف واحد أو قرار واحد" صادم. ابدأ بالحدث مباشرة لتوليد فضول لا يقاوم.

3. التميز: ابحث عن الزوايا التي لم يتم استهلاكها في المحتوى العربي.

4. قائمة الاستبعاد: ممنوع نهائياً اقتراح أو تكرار أي موضوع من هذه القائمة: ${usedTitlesText}.

أجب بالتنسيق التالي فقط:
عنوان: [العنوان]
وصف: [الوصف]`,
              },
              {
                role: "user",
                content: `النوع الرئيسي: ${randomCat.main}\nالموضوع الفرعي: ${randomSub}`,
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
    console.log("Message content:", message);
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
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "حدث خطأ أثناء الإرسال التلقائي" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
