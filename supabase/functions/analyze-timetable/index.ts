import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { geminiFetch } from "../_shared/gemini.ts";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
type ClassEvent = { title: string; start: string; end: string; location?: string };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const token = req.headers.get("Authorization") ?? "";
    const auth = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: token } } });
    const { data: { user } } = await auth.auth.getUser();
    if (!user) return Response.json({ error: "Authentication required." }, { status: 401, headers: CORS });
    const { resourceId, text, semesterStart, semesterEnd, timezone = "Africa/Nairobi", reminderMinutes = 30 } = await req.json();
    if (!resourceId || typeof text !== "string" || !semesterStart || !semesterEnd) return Response.json({ error: "Timetable text, resource ID, and semester dates are required." }, { status: 400, headers: CORS });
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: resource } = await admin.from("personal_resources").select("id,user_id").eq("id", resourceId).single();
    if (!resource || resource.user_id !== user.id) return Response.json({ error: "Resource not found." }, { status: 404, headers: CORS });
    await admin.from("personal_resources").update({ processing_status: "processing", extracted_text: text }).eq("id", resourceId);
    const prompt = `Extract class meetings from this student timetable. Expand every weekly class into individual events between ${semesterStart} and ${semesterEnd} in timezone ${timezone}. Return JSON only: {"events":[{"title":"Course name","start":"ISO-8601 datetime with offset","end":"ISO-8601 datetime with offset","location":"room"}]}. Do not invent unclear classes.\n\nTIMETABLE:\n${text}`;
    const response = await geminiFetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0, responseMimeType: "application/json" } }) });
    if (!response.ok) throw new Error("Gemini request failed");
    const result = await response.json(); const parsed = JSON.parse(result.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}");
    const events: ClassEvent[] = Array.isArray(parsed.events) ? parsed.events : [];
    await admin.from("calendar_events").delete().eq("resource_id", resourceId);
    const rows = events.filter((event) => event.title && event.start && event.end).map((event) => ({ user_id: user.id, resource_id: resourceId, title: event.title, starts_at: event.start, ends_at: event.end, location: event.location, category: "class" }));
    if (rows.length) { const { data: saved, error } = await admin.from("calendar_events").insert(rows).select("id"); if (error) throw error; await admin.from("event_reminders").insert(saved.map((event) => ({ event_id: event.id, minutes_before: reminderMinutes, in_app: true }))); }
    await admin.from("personal_resources").update({ processing_status: "ready" }).eq("id", resourceId);
    return Response.json({ eventsCreated: rows.length, reminderMinutes }, { headers: CORS });
  } catch { return Response.json({ error: "Unable to analyse timetable." }, { status: 500, headers: CORS }); }
});
