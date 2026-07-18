import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password } = await req.json();
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedPassword = String(password || "");

    if (!normalizedEmail || !normalizedPassword) {
      return new Response(JSON.stringify({ error: "Email and password required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: adminUser, error } = await supabase
      .from("admin_users")
      .select("*")
      .eq("email", normalizedEmail)
      .eq("is_active", true)
      .maybeSingle();

    if (error || !adminUser || !adminUser.password_hash) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Support both plain text (legacy) and bcrypt hashes
    let valid = false;
    if (adminUser.password_hash.startsWith("$2")) {
      const bcrypt = await import("https://deno.land/x/bcrypt@v0.4.1/mod.ts");
      try {
        valid = await bcrypt.compare(normalizedPassword, adminUser.password_hash);
      } catch {
        valid = false;
      }
    } else {
      valid = normalizedPassword === adminUser.password_hash;
    }

    if (!valid) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase
      .from("admin_users")
      .update({ last_login: new Date().toISOString() })
      .eq("id", adminUser.id);

    const { password_hash, ...safeUser } = adminUser;
    return new Response(JSON.stringify({ adminUser: safeUser }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("admin-login error", e);
    return new Response(JSON.stringify({ error: "Login failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
