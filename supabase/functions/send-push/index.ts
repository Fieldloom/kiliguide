import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
webpush.setVapidDetails(Deno.env.get("VAPID_SUBJECT")!, Deno.env.get("VAPID_PUBLIC_KEY")!, Deno.env.get("VAPID_PRIVATE_KEY")!);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const token = req.headers.get("Authorization") ?? "";
    const auth = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: token } } });
    const { data: { user } } = await auth.auth.getUser();
    if (!user) return Response.json({ error: "Authentication required." }, { status: 401, headers: CORS });

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    // Check if the user is an admin or dept_admin
    const { data: roleData } = await admin.from("user_roles").select("role").eq("user_id", user.id).single();
    if (!roleData || (roleData.role !== "administrator" && roleData.role !== "super_admin" && roleData.role !== "dept_admin")) {
      return Response.json({ error: "Unauthorized." }, { status: 403, headers: CORS });
    }

    const { recipientId, title, body, url, tag } = await req.json();
    
    let query = admin.from("push_subscriptions").select("id,endpoint,p256dh,auth");
    if (recipientId && recipientId !== "all") {
      query = query.eq("user_id", recipientId);
    }
    
    const { data: subscriptions } = await query;
    let delivered = 0;

    await Promise.all((subscriptions ?? []).map(async (subscription) => {
      try {
        await webpush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, JSON.stringify({ title, body, url, tag }), { TTL: 300, urgency: "high" });
        delivered++;
      } catch (error: any) {
        if (error?.statusCode === 404 || error?.statusCode === 410) {
          await admin.from("push_subscriptions").delete().eq("id", subscription.id);
        }
      }
    }));

    return Response.json({ delivered }, { headers: CORS });
  } catch(e) {
    console.error(e);
    return Response.json({ error: "Unable to send push notification." }, { status: 500, headers: CORS });
  }
});
