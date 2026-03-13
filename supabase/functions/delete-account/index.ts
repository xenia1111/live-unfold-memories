import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify user with anon client
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await anonClient.auth.getUser();
    if (userErr || !user) throw new Error("Unauthorized");

    const userId = user.id;

    // Use service role to delete all user data
    const admin = createClient(supabaseUrl, serviceKey);

    // Delete user data from all tables
    await admin.from("tasks").delete().eq("user_id", userId);
    await admin.from("ai_stories").delete().eq("user_id", userId);
    await admin.from("story_notes").delete().eq("user_id", userId);
    await admin.from("cat_profiles").delete().eq("user_id", userId);
    await admin.from("profiles").delete().eq("id", userId);

    // Delete storage files
    const { data: avatarFiles } = await admin.storage.from("avatars").list(userId);
    if (avatarFiles?.length) {
      await admin.storage.from("avatars").remove(avatarFiles.map(f => `${userId}/${f.name}`));
    }
    const { data: photoFiles } = await admin.storage.from("task-photos").list(userId);
    if (photoFiles?.length) {
      await admin.storage.from("task-photos").remove(photoFiles.map(f => `${userId}/${f.name}`));
    }

    // Delete auth user
    const { error: deleteErr } = await admin.auth.admin.deleteUser(userId);
    if (deleteErr) throw deleteErr;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
