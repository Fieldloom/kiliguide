import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { geminiFetch } from "../_shared/gemini.ts";
import { encodeBase64 } from "jsr:@std/encoding/base64";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const token = req.headers.get("Authorization") ?? "";
    const auth = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: token } } });
    const { data: { user } } = await auth.auth.getUser();
    if (!user) return Response.json({ error: "Authentication required." }, { status: 401, headers: CORS });
    
    const { resourceId } = await req.json();
    if (!resourceId) return Response.json({ error: "resourceId is required." }, { status: 400, headers: CORS });
    
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: resource } = await admin.from("personal_resources").select("id,user_id,storage_path").eq("id", resourceId).single();
    if (!resource || resource.user_id !== user.id || !resource.storage_path) return Response.json({ error: "Resource not found or missing file." }, { status: 404, headers: CORS });
    
    // Download the file from Supabase Storage
    const { data: fileData, error: downloadError } = await admin.storage.from("personal-resources").download(resource.storage_path);
    if (downloadError || !fileData) throw new Error("Failed to download file: " + downloadError?.message);

    const ext = resource.storage_path.split('.').pop()?.toLowerCase() || '';
    const mimeType = ext === 'pdf' ? 'application/pdf' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
    const buffer = await fileData.arrayBuffer();
    const base64Data = encodeBase64(new Uint8Array(buffer));

    const promptText = `Analyze this student timetable document. Extract all unique Class Groups (Semesters like 'BBIT 3.1', 'IT 2.1') found in the column headers, and all unique Course/Unit names found in the cells. Also, map which courses belong to which Class Group. Return JSON only in this exact format: {"groups":["string"],"courses":["string"], "mapped": {"group_name": ["course_name"]}}. Do not include times or dates, just the strings.`;
    
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
    
    return Response.json({
      groups: Array.isArray(parsed.groups) ? parsed.groups : [],
      courses: Array.isArray(parsed.courses) ? parsed.courses : [],
      mapped: typeof parsed.mapped === "object" && parsed.mapped !== null ? parsed.mapped : {}
    }, { headers: CORS });
  } catch(e: any) { 
    console.error("Analyze error:", e);
    return Response.json({ error: e.message || "Unable to extract metadata." }, { status: 200, headers: CORS }); 
  }
});
