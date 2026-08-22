import { createClient } from "npm:@supabase/supabase-js@2";

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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    const normalizedEmail = user?.email?.trim().toLowerCase();
    if (userError || !user || !normalizedEmail) return json({ error: "Unauthorized" }, 401);

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

    if (error || !adminUser || !["admin", "super_admin"].includes(adminUser.role)) {
      return json({ error: "Admin access required" }, 403);
    }

    await supabase
      .from("admin_users")
      .update({ last_login: new Date().toISOString() })
      .eq("id", adminUser.id);

    const { password_hash: _passwordHash, ...safeUser } = adminUser;
    return json({ adminUser: { ...safeUser, auth_user_id: user.id } }, 200);
  } catch (e) {
    console.error("admin-login error", e);
    return json({ error: "Login failed" }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
