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

function unauthorized(corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify({ success: false, error: "غير مصرح" }), {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return unauthorized(corsHeaders);

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) return unauthorized(corsHeaders);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { count: total } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true });

    const today = new Date().toISOString().split("T")[0];
    const { count: todayCount } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .gte("sent_at", today);

    const { data: settings } = await supabase
      .from("telegram_settings")
      .select("api_id, api_hash, session_string")
      .limit(1)
      .single();

    const isConnected = !!(settings?.api_id && settings?.api_hash && settings?.session_string);

    return new Response(
      JSON.stringify({ success: true, total: total || 0, today: todayCount || 0, isConnected }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("get-stats error:", error instanceof Error ? error.message : "Unknown error");
    return new Response(
      JSON.stringify({ success: false, error: "حدث خطأ أثناء جلب الإحصائيات" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
