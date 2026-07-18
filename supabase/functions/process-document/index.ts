import { createClient } from "npm:@supabase/supabase-js@2";
import mammoth from "npm:mammoth@1.8.0";
import { Buffer } from "node:buffer";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const { documentId, storagePath, extension } = await req.json();
    if (!documentId || !storagePath || !extension) {
      throw new Error("Missing documentId, storagePath, or extension");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Download file
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("documents")
      .download(storagePath);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message}`);
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    let extractedText = "";
    
    async function fallbackOcr(buf: Buffer, mime: string) {
      const keys = [Deno.env.get("GEMINI_API_KEY_1"), Deno.env.get("GEMINI_API_KEY_2")].filter(Boolean);
      const apiKey = keys[0];
      if (!apiKey) throw new Error("GEMINI_API_KEY_1 is not configured.");

      // Upload file to Gemini File API
      const uploadRes = await fetch(`https://generativelanguage.googleapis.com/upload/v1beta/files?uploadType=media&key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": mime },
        body: buf
      });
      if (!uploadRes.ok) throw new Error(`Gemini File Upload failed: ${await uploadRes.text()}`);
      const uploadData = await uploadRes.json();
      const fileUri = uploadData.file.uri;
      const fileName = uploadData.file.name;

      // Poll until file is ACTIVE
      for (let i = 0; i < 15; i++) {
        const fileCheck = await fetch(`https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${apiKey}`);
        if (!fileCheck.ok) throw new Error(`Failed to check file state: ${await fileCheck.text()}`);
        const fileState = await fileCheck.json();
        if (fileState.state === "ACTIVE") break;
        if (fileState.state === "FAILED") throw new Error("Gemini failed to process the PDF.");
        await new Promise(r => setTimeout(r, 2000)); // wait 2 seconds
      }

      // Extract text using the file URI
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [
              { text: "Extract all text from this document accurately. Preserve structure, tables, and lists. Do not add any extra commentary." },
              { fileData: { mimeType: mime, fileUri: fileUri } }
            ]
          }],
          generationConfig: { temperature: 0 }
        })
      });

      // Fire-and-forget deletion to keep storage clean
      fetch(`https://generativelanguage.googleapis.com/v1beta/files/${fileName.replace('files/', '')}?key=${apiKey}`, { method: "DELETE" }).catch(() => {});

      if (!response.ok) throw new Error(`Gemini OCR failed: ${await response.text()}`);
      const res = await response.json();
      return res.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }

    if (extension === "pdf") {
      console.log("Using Gemini OCR for PDF document...");
      extractedText = await fallbackOcr(buffer, "application/pdf");
    } else if (extension === "docx") {
      console.log("Using Mammoth for DOCX document...");
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else {
      throw new Error(`Unsupported extension: ${extension}`);
    }

    if (!extractedText || extractedText.trim().length < 10) {
      throw new Error("No meaningful text extracted from the document even after OCR.");
    }

    // Call ingest-document
    const ingestUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/ingest-document`;
    const ingestResponse = await fetch(ingestUrl, {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({ documentId, text: extractedText })
    });

    if (!ingestResponse.ok) {
       throw new Error(`Ingestion pipeline failed: ${await ingestResponse.text()}`);
    }

    return Response.json({ success: true, chunks: (await ingestResponse.json()).chunks }, { headers: CORS });
  } catch (err: any) {
    console.error("Process Document Error:", err.stack);
    return Response.json({ success: false, error: err.stack || err.message }, { status: 200, headers: CORS });
  }
});
