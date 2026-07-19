import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { geminiFetch } from "../_shared/gemini.ts";
import { encodeBase64 } from "jsr:@std/encoding/base64";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
type ClassEvent = { title: string; start: string; end: string; location?: string };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const token = req.headers.get("Authorization") ?? "";
    const auth = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: token } } });
    const { data: { user } } = await auth.auth.getUser();
    if (!user) return Response.json({ error: "Authentication required." }, { status: 401, headers: CORS });
    
    const { resourceId, semesterStart, semesterEnd, timezone = "Africa/Nairobi", reminderMinutes = 30, courses = "" } = await req.json();
    if (!resourceId || !semesterStart || !semesterEnd) return Response.json({ error: "resourceId and semester dates are required." }, { status: 400, headers: CORS });
    
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: resource } = await admin.from("personal_resources").select("id,user_id,storage_path").eq("id", resourceId).single();
    if (!resource || resource.user_id !== user.id || !resource.storage_path) return Response.json({ error: "Resource not found or missing file." }, { status: 404, headers: CORS });
    
    await admin.from("personal_resources").update({ processing_status: "processing" }).eq("id", resourceId);

    // Download the file from Supabase Storage
    const { data: fileData, error: downloadError } = await admin.storage.from("personal-resources").download(resource.storage_path);
    if (downloadError || !fileData) throw new Error("Failed to download file: " + downloadError?.message);

    const ext = resource.storage_path.split('.').pop()?.toLowerCase() || '';
    const mimeType = ext === 'pdf' ? 'application/pdf' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
    const buffer = await fileData.arrayBuffer();
    const base64Data = encodeBase64(new Uint8Array(buffer));

    const courseFilter = courses.trim()
      ? `IMPORTANT: Only extract classes for these specific units that the student is enrolled in: ${courses}. Ignore all other courses in the timetable.`
      : `Extract ALL classes found in the timetable.`;

    const promptText = `Analyze this student timetable document. ${courseFilter} Expand every weekly class into individual events between ${semesterStart} and ${semesterEnd} in timezone ${timezone}. Return JSON only: {"events":[{"title":"Course name","start":"ISO-8601 datetime with offset","end":"ISO-8601 datetime with offset","location":"room"}]}. Do not invent unclear classes.`;
    
    const payload = {
      contents: [{
        parts: [
          { text: promptText },
          { inline_data: { mime_type: mimeType, data: base64Data } }
        ]
      }],
      generationConfig: { temperature: 0, responseMimeType: "application/json" }
    };

    const response = await geminiFetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error body:", errText);
      throw new Error("Gemini request failed: " + errText);
    }
    
    const result = await response.json(); 
    let textResult = result.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    textResult = textResult.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
    
    let parsed: any = {};
    try {
      parsed = JSON.parse(textResult);
    } catch (parseErr) {
      console.error("JSON parse error:", parseErr, "Text:", textResult);
      throw new Error("Failed to parse Gemini response as JSON.");
    }
    
    const events: ClassEvent[] = Array.isArray(parsed.events) ? parsed.events : [];
    
    await admin.from("calendar_events").delete().eq("resource_id", resourceId);
    
    const rows = events.filter((event) => event.title && event.start && event.end).map((event) => ({ user_id: user.id, resource_id: resourceId, title: event.title, starts_at: event.start, ends_at: event.end, location: event.location, category: "class" }));
    if (rows.length) { 
      const { data: saved, error } = await admin.from("calendar_events").insert(rows).select("id"); 
      if (error) throw error; 
      await admin.from("event_reminders").insert(saved.map((event) => ({ event_id: event.id, minutes_before: reminderMinutes, in_app: true }))); 
    }
    
    await admin.from("personal_resources").update({ processing_status: "ready" }).eq("id", resourceId);
    return Response.json({ eventsCreated: rows.length, reminderMinutes }, { headers: CORS });
  } catch(e: any) { 
    console.error("Analyze error:", e);
    return Response.json({ error: e.message || "Unable to analyse timetable." }, { status: 200, headers: CORS }); 
  }
});
