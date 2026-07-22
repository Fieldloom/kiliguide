import { createClient } from "npm:@supabase/supabase-js@2";
import mammoth from "npm:mammoth@1.8.0";
import * as pdfjsLib from "npm:pdfjs-dist@3.11.174/legacy/build/pdf.js";
import { Buffer } from "node:buffer";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/** Extract text from a PDF that has an embedded text layer using pdfjs */
async function extractPdfText(buf: Buffer): Promise<string> {
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

/** Use Gemini File API for scanned/image-based PDFs that have no embedded text */
async function geminiOcr(buf: Buffer, mimeType: string): Promise<string> {
  const apiKey = Deno.env.get("GEMINI_API_KEY_1") || Deno.env.get("GEMINI_API_KEY_2");
  if (!apiKey) throw new Error("GEMINI_API_KEY_1 is not configured.");

  // Upload to Gemini File API
  const uploadRes = await fetch(
    `https://generativelanguage.googleapis.com/upload/v1beta/files?uploadType=media&key=${apiKey}`,
    { method: "POST", headers: { "Content-Type": mimeType }, body: buf }
  );
  if (!uploadRes.ok) throw new Error(`Gemini upload failed: ${await uploadRes.text()}`);
  const uploadData = await uploadRes.json();
  const fileUri = uploadData.file.uri;
  const fileName = uploadData.file.name;

  // Poll until ACTIVE (up to 30 seconds)
  for (let i = 0; i < 15; i++) {
    const checkRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${apiKey}`);
    if (!checkRes.ok) throw new Error(`File state check failed: ${await checkRes.text()}`);
    const { state } = await checkRes.json();
    if (state === "ACTIVE") break;
    if (state === "FAILED") throw new Error("Gemini could not process the PDF.");
    await new Promise(r => setTimeout(r, 2000));
  }

  // Extract text
  const genRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [
            { text: "Extract ALL text from this document exactly as written. Include every word, number, table, and list. Do not summarise or add commentary." },
            { fileData: { mimeType, fileUri } }
          ]
        }],
        generationConfig: { temperature: 0 }
      })
    }
  );

  // Delete the uploaded file (fire-and-forget)
  fetch(`https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${apiKey}`, { method: "DELETE" }).catch(() => {});

  if (!genRes.ok) throw new Error(`Gemini generation failed: ${await genRes.text()}`);
  const genData = await genRes.json();
  return (genData.candidates?.[0]?.content?.parts?.[0]?.text ?? "").trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  let currentDocumentId = "";
  try {
    const { documentId, storagePath, extension } = await req.json();
    currentDocumentId = documentId;
    if (!documentId || !storagePath || !extension) {
      throw new Error("Missing documentId, storagePath, or extension");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("documents")
      .download(storagePath);
    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message}`);
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let extractedText = "";

    if (extension === "pdf") {
      // Step 1: try fast offline text extraction
      console.log("Attempting pdfjs text extraction...");
      extractedText = await extractPdfText(buffer);
      console.log(`pdfjs extracted ${extractedText.length} chars`);

      // Step 2: if pdfjs got nothing (scanned/image PDF), use Gemini vision
      if (extractedText.length < 100) {
        console.log("pdfjs returned insufficient text — falling back to Gemini OCR...");
        extractedText = await geminiOcr(buffer, "application/pdf");
        console.log(`Gemini OCR extracted ${extractedText.length} chars`);
      }
    } else if (extension === "docx") {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value.trim();
    } else {
      throw new Error(`Unsupported extension: ${extension}`);
    }

    if (!extractedText || extractedText.length < 80) {
      throw new Error(`Text extraction returned insufficient content (${extractedText.length} chars). The document may be empty or password-protected.`);
    }

    try {
      const apiKey = Deno.env.get("GEMINI_API_KEY_1") || Deno.env.get("GEMINI_API_KEY_2");
      const { data: depts } = await supabase.from("departments").select("name");
      const deptNames = depts?.map((d: any) => d.name).join(" | ") || "";
      
      const prompt = `Analyze this university document and determine its target audience and department.
      Respond ONLY with a valid JSON object matching exactly this schema:
      {
        "audience": "postgraduate" | "undergraduate" | "staff" | "parent" | "all",
        "department": "${deptNames} | all"
      }
      If the document is general or applies to everyone, you MUST use "all". 
      Document:
      ${extractedText.slice(0, 3000)}`;

      const aiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
          })
        }
      );
      if (aiRes.ok) {
        const aiData = await aiRes.json();
        const rawJson = aiData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawJson) {
          const tags = JSON.parse(rawJson);
          await supabase.from("documents").update({ metadata: tags }).eq("id", documentId);
        }
      }
    } catch (e) {
      console.warn("Failed to auto-tag document:", e);
    }

    // Send extracted text to ingest-document for chunking + embeddings
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
    if (currentDocumentId) {
      try {
        const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
        await supabase.from("documents").update({
          processing_status: "failed",
          processing_error: String(err.message).slice(0, 500)
        }).eq("id", currentDocumentId);
      } catch { /* ignore */ }
    }
    return Response.json({ success: false, error: err.stack || err.message }, { status: 200, headers: CORS });
  }
});
