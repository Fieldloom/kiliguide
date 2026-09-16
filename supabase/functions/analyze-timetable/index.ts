import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { geminiFetch } from "../_shared/gemini.ts";
import { encodeBase64 } from "jsr:@std/encoding/base64";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

async function extractPdfText(buf: ArrayBuffer): Promise<string> {
  try {
    const pdfjsLib = await import("npm:pdfjs-dist@3.11.174/legacy/build/pdf.js");
    const data = new Uint8Array(buf);
    const pdfLib = (pdfjsLib as any).default ?? pdfjsLib;
    const loadingTask = pdfLib.getDocument({ data, useSystemFonts: true });
    const pdfDocument = await loadingTask.promise;
    let fullText = "";
    for (let i = 1; i <= Math.min(pdfDocument.numPages, 10); i++) {
      const page = await pdfDocument.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(" ");
      fullText += pageText + "\n\n";
    }
    return fullText.trim();
  } catch (err) {
    console.warn("pdfjs extraction failed or skipped:", err);
    return "";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const token = req.headers.get("Authorization") ?? "";
    const auth = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: token } } });
    const { data: { user } } = await auth.auth.getUser();

    const { resourceId, semesterStart, semesterEnd, timezone = "Africa/Nairobi", reminderMinutes = 30, courses = "" } = await req.json().catch(() => ({}));
    if (!resourceId || !semesterStart || !semesterEnd) {
      return Response.json({ error: "resourceId and semester dates are required." }, { status: 200, headers: CORS });
    }

    const { data: resource } = await admin.from("personal_resources").select("id,user_id,storage_path").eq("id", resourceId).single();
    if (!resource || !resource.storage_path) {
      return Response.json({ error: "Resource not found or missing file path." }, { status: 200, headers: CORS });
    }

    const targetUserId = user?.id || resource.user_id;

    await admin.from("personal_resources").update({ processing_status: "processing" }).eq("id", resourceId);

    // Download the file from Supabase Storage
    const { data: fileData, error: downloadError } = await admin.storage.from("personal-resources").download(resource.storage_path);
    if (downloadError || !fileData) {
      return Response.json({ error: `Failed to download file from storage: ${downloadError?.message || 'File empty'}` }, { status: 200, headers: CORS });
    }

    const ext = resource.storage_path.split('.').pop()?.toLowerCase() || '';
    const mimeType = ext === 'pdf' ? 'application/pdf' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
    const buffer = await fileData.arrayBuffer();

    const dekutKnowledge = `DeKUT Timetable Layout Rule: The timetable columns define the specific class group by Course and Year.Semester (e.g., 'BBIT 3.1' means Bachelor of Business IT, Year 3 Semester 1; 'IT 2.1' means IT Year 2 Semester 1). You MUST cross-reference the class cells with these column headers to know who the class belongs to.`;

    const courseFilter = courses.trim()
      ? `IMPORTANT: The student is enrolled in classes under: ${courses}. Find the columns that match these courses/groups and ONLY extract recurring weekly classes from those specific columns. Ignore all other columns.`
      : `Extract ALL recurring weekly classes found in the timetable across all columns.`;

    let parts: any[] = [];
    if (ext === 'pdf') {
      const extractedText = await extractPdfText(buffer);
      if (extractedText && extractedText.length > 50) {
        parts = [
          { text: `Analyze this student timetable text content:\n\n${extractedText}\n\n${dekutKnowledge} ${courseFilter} Extract all recurring weekly classes for the specified course/group. Return JSON only in this exact format: {"classes":[{"title":"Course Name or Code","dayOfWeek":"Monday","startTime":"08:00","endTime":"11:00","location":"Room Name"}]}. Use 24-hour time format (HH:mm) for startTime and endTime. Day of week must be English name (e.g. Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday).` }
        ];
      }
    }

    if (!parts.length) {
      const base64Data = encodeBase64(new Uint8Array(buffer));
      const promptText = `Analyze this student timetable document. ${dekutKnowledge} ${courseFilter} Extract all recurring weekly classes for the specified course/group. Return JSON only in this exact format: {"classes":[{"title":"Course Name or Code","dayOfWeek":"Monday","startTime":"08:00","endTime":"11:00","location":"Room Name"}]}. Use 24-hour time format (HH:mm) for startTime and endTime. Day of week must be English name (e.g. Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday).`;
      parts = [
        { inlineData: { mimeType, data: base64Data } },
        { text: promptText }
      ];
    }

    const geminiPayload = {
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json"
      }
    };

    const response = await geminiFetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geminiPayload)
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error body:", errText);
      return Response.json({ error: `Gemini API request failed (${response.status}): ${errText}` }, { status: 200, headers: CORS });
    }

    const geminiResult = await response.json();
    let textResult = geminiResult.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    textResult = textResult.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
    
    let parsed: any = {};
    try {
      parsed = JSON.parse(textResult);
    } catch (parseErr) {
      const jsonMatch = textResult.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch (innerErr) {
          console.error("JSON parse error:", textResult.substring(0, 500));
          return Response.json({ error: "Failed to parse AI response as JSON." }, { status: 200, headers: CORS });
        }
      } else {
        console.error("No JSON found in response:", textResult.substring(0, 500));
        return Response.json({ error: "Failed to parse AI response as JSON." }, { status: 200, headers: CORS });
      }
    }
    
    const classesList: any[] = Array.isArray(parsed.classes) ? parsed.classes : Array.isArray(parsed.events) ? parsed.events : [];
    
    const daysMap: Record<string, number> = {
      sunday: 0, sun: 0,
      monday: 1, mon: 1,
      tuesday: 2, tue: 2, tues: 2,
      wednesday: 3, wed: 3,
      thursday: 4, thu: 4, thur: 4,
      friday: 5, fri: 5,
      saturday: 6, sat: 6
    };

    const startDt = new Date(semesterStart);
    const endDt = new Date(semesterEnd);
    const rows: any[] = [];

    for (const cls of classesList) {
      if (!cls.title || !cls.dayOfWeek) continue;

      const dayStr = String(cls.dayOfWeek).toLowerCase().trim();
      const targetDay = daysMap[dayStr] ?? 1;

      let startH = 8, startM = 0;
      let endH = 10, endM = 0;

      if (cls.startTime && typeof cls.startTime === "string" && cls.startTime.includes(":")) {
        const parts = cls.startTime.split(":").map(Number);
        startH = isNaN(parts[0]) ? 8 : parts[0];
        startM = isNaN(parts[1]) ? 0 : parts[1];
      }
      if (cls.endTime && typeof cls.endTime === "string" && cls.endTime.includes(":")) {
        const parts = cls.endTime.split(":").map(Number);
        endH = isNaN(parts[0]) ? 10 : parts[0];
        endM = isNaN(parts[1]) ? 0 : parts[1];
      }

      // Loop through dates between startDt and endDt to generate semester schedule
      const curr = new Date(startDt);
      while (curr <= endDt) {
        if (curr.getDay() === targetDay) {
          const s = new Date(curr);
          s.setHours(startH, startM, 0, 0);

          const e = new Date(curr);
          e.setHours(endH, endM, 0, 0);

          rows.push({
            user_id: targetUserId,
            resource_id: resourceId,
            title: cls.title,
            starts_at: s.toISOString(),
            ends_at: e.toISOString(),
            location: cls.location || "",
            category: "class"
          });
        }
        curr.setDate(curr.getDate() + 1);
      }
    }

    await admin.from("calendar_events").delete().eq("resource_id", resourceId);
    
    if (rows.length) { 
      const { data: saved, error: insertError } = await admin.from("calendar_events").insert(rows).select("id"); 
      if (insertError) throw insertError; 
      if (saved && saved.length) {
        await admin.from("event_reminders").insert(saved.map((event) => ({ event_id: event.id, minutes_before: reminderMinutes, in_app: true }))); 
      }
    }
    
    await admin.from("personal_resources").update({ processing_status: "ready" }).eq("id", resourceId);
    return Response.json({ eventsCreated: rows.length, reminderMinutes }, { headers: CORS });
  } catch(e: any) { 
    console.error("Analyze error:", e);
    return Response.json({ error: e.message || "Unable to analyse timetable." }, { status: 200, headers: CORS }); 
  }
});
