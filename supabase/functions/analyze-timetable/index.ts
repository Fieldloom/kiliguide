import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { geminiFetch } from "../_shared/gemini.ts";
import { encodeBase64 } from "jsr:@std/encoding/base64";

async function extractPdfText(buf: ArrayBuffer): Promise<string> {
  const pdfjsLib = await import("npm:pdfjs-dist@3.11.174/legacy/build/pdf.js");
  const data = new Uint8Array(buf);
  const pdfLib = (pdfjsLib as any).default ?? pdfjsLib;
  const loadingTask = pdfLib.getDocument({ data, useSystemFonts: true });
  const pdfDocument = await loadingTask.promise;
  let fullText = "";
  for (let i = 1; i <= pdfDocument.numPages; i++) {
    const page = await pdfDocument.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(" ");
    fullText += pageText + "\n\n";
  }
  return fullText.trim();
}
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

    const dekutKnowledge = `DeKUT Timetable Layout Rule: The timetable columns define the specific class group by Course and Year.Semester (e.g., 'BBIT 3.1' means Bachelor of Business IT, Year 3 Semester 1; 'IT 2.1' means IT Year 2 Semester 1). You MUST cross-reference the class cells with these column headers to know who the class belongs to.`;

    const courseFilter = courses.trim()
      ? `IMPORTANT: The student is enrolled in classes under: ${courses}. Find the columns that match these courses/groups (e.g., matching the course code and Year.Semester) and ONLY extract classes from those specific columns. Ignore all other columns.`
      : `Extract ALL classes found in the timetable across all columns.`;

    const promptText = `Analyze this student timetable document. ${dekutKnowledge} ${courseFilter} Expand every weekly class into individual events between ${semesterStart} and ${semesterEnd} in timezone ${timezone}. Return JSON only: {"events":[{"title":"Course name","start":"ISO-8601 datetime with offset","end":"ISO-8601 datetime with offset","location":"room"}]}. Do not invent unclear classes.`;
    
    let textResult = "{}";

    if (mimeType.startsWith("image/")) {
      // Use NVIDIA for images
      const nvidiaKey = Deno.env.get("NVIDIA_API_KEY");
      if (!nvidiaKey) throw new Error("NVIDIA_API_KEY is not configured.");

      const payload = {
        model: "meta/llama-3.2-11b-vision-instruct",
        messages: [
          {
            role: "system",
            content: "You are a JSON-only data extraction system. You MUST respond with ONLY a valid JSON object. No explanations, no markdown, no text before or after the JSON. Just the raw JSON object."
          },
          {
            role: "user",
            content: [
              { type: "text", text: promptText },
              { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Data}` } }
            ]
          }
        ],
        temperature: 0,
        max_tokens: 4000
      };

      const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${nvidiaKey}` }, body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("NVIDIA API error body:", errText);
        throw new Error("NVIDIA request failed: " + errText);
      }

      const result = await response.json();
      textResult = result.choices?.[0]?.message?.content ?? "{}";
    } else {
      // Use Cerebras for PDFs after extracting text
      const cerebrasKey = Deno.env.get("CEREBRAS_API_KEY");
      if (!cerebrasKey) throw new Error("CEREBRAS_API_KEY is not configured.");
      
      const pdfText = await extractPdfText(buffer);
      if (!pdfText) throw new Error("No text could be extracted from this PDF.");

      const payload = {
        model: "llama3.1-70b",
        messages: [
          { role: "system", content: "You are a highly accurate data extraction system. You only output valid JSON based on the user's instructions." },
          { role: "user", content: promptText + "\n\nRaw Extracted Timetable Text:\n" + pdfText }
        ],
        temperature: 0,
        response_format: { type: "json_object" }
      };

      const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${cerebrasKey}` }, body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errText = await response.text();
        console.error("Cerebras API error body:", errText);
        throw new Error("Cerebras request failed: " + errText);
      }
      
      const result = await response.json(); 
      textResult = result.choices?.[0]?.message?.content ?? "{}";
    }
    
    textResult = textResult.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
    
    let parsed: any = {};
    try {
      parsed = JSON.parse(textResult);
    } catch (parseErr) {
      // Try to extract JSON object from within the text
      const jsonMatch = textResult.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch (innerErr) {
          console.error("JSON parse error (both attempts):", "Text:", textResult.substring(0, 500));
          throw new Error("Failed to parse AI response as JSON.");
        }
      } else {
        console.error("No JSON found in response:", textResult.substring(0, 500));
        throw new Error("Failed to parse AI response as JSON.");
      }
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
