import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { geminiFetch } from "../_shared/gemini.ts";
import { encodeBase64 } from "jsr:@std/encoding/base64";
import * as pdfjsLib from "npm:pdfjs-dist@4.4.162";

async function extractPdfText(buf: ArrayBuffer): Promise<string> {
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
    
    let textResult = "{}";

    if (mimeType.startsWith("image/")) {
      // Use NVIDIA for images
      const nvidiaKey = Deno.env.get("NVIDIA_API_KEY");
      if (!nvidiaKey) throw new Error("NVIDIA_API_KEY is not configured.");

      const payload = {
        model: "meta/llama-3.2-90b-vision-instruct",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: promptText },
              { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Data}` } }
            ]
          }
        ],
        temperature: 0,
        max_tokens: 2000
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
      console.error("JSON parse error:", parseErr, "Text:", textResult);
      throw new Error("Failed to parse AI response as JSON.");
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
