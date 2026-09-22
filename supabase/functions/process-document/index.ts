import { createClient } from "npm:@supabase/supabase-js@2";
import mammoth from "npm:mammoth@1.8.0";
import * as pdfjsLib from "npm:pdfjs-dist@3.11.174/legacy/build/pdf.js";
import { Buffer } from "node:buffer";
import { availableKeys, delay, geminiFetch, modelsToTry } from "../_shared/gemini.ts";

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

/** 
 * Use Gemini File API & Base64 Multimodal OCR for scanned/image-based PDFs.
 * Features key rotation, multi-model fallback cascade, exponential backoff on 503/429, 
 * and inline base64 redundancy.
 */
async function geminiOcr(buf: Buffer, mimeType: string): Promise<string> {
  const keys = availableKeys();
  if (!keys.length) throw new Error("No Gemini API key is configured in environment.");

  let uploadedFileUri: string | null = null;
  let uploadedFileName: string | null = null;
  let uploadKey: string | null = null;

  // Step A: Attempt File API upload across available keys
  for (const key of keys) {
    try {
      const uploadRes = await fetch(
        `https://generativelanguage.googleapis.com/upload/v1beta/files?uploadType=media&key=${encodeURIComponent(key)}`,
        { method: "POST", headers: { "Content-Type": mimeType }, body: buf }
      );
      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        uploadedFileUri = uploadData.file.uri;
        uploadedFileName = uploadData.file.name;
        uploadKey = key;
        break;
      }
    } catch (e) {
      console.warn("Gemini File API upload key attempt failed:", e);
    }
  }

  // If File API upload succeeded, poll state and run model fallback cascade
  if (uploadedFileUri && uploadedFileName && uploadKey) {
    try {
      // Poll file state until ACTIVE (up to 20 seconds)
      let active = false;
      for (let i = 0; i < 10; i++) {
        const checkRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/${uploadedFileName}?key=${encodeURIComponent(uploadKey)}`);
        if (checkRes.ok) {
          const { state } = await checkRes.json();
          if (state === "ACTIVE") { active = true; break; }
          if (state === "FAILED") break;
        }
        await delay(1500);
      }

      if (active) {
        // Run model fallback cascade with key rotation & backoff for generateContent
        const errors: string[] = [];
        let retryAttempt = 0;

        for (const model of modelsToTry) {
          for (const key of keys) {
            try {
              const genRes = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    contents: [{
                      role: "user",
                      parts: [
                        { text: "Extract ALL text from this document exactly as written. Include every word, number, table, and list. Do not summarise or add commentary." },
                        { fileData: { mimeType, fileUri: uploadedFileUri } }
                      ]
                    }],
                    generationConfig: { temperature: 0 }
                  })
                }
              );

              if (genRes.ok) {
                const genData = await genRes.json();
                const extracted = (genData.candidates?.[0]?.content?.parts?.[0]?.text ?? "").trim();
                if (extracted.length > 30) {
                  // Fire-and-forget delete
                  fetch(`https://generativelanguage.googleapis.com/v1beta/${uploadedFileName}?key=${encodeURIComponent(uploadKey)}`, { method: "DELETE" }).catch(() => {});
                  return extracted;
                }
              }

              const errText = await genRes.text();
              errors.push(`[${model}, status ${genRes.status}]: ${errText.substring(0, 100)}`);

              if ([429, 500, 502, 503, 504].includes(genRes.status)) {
                retryAttempt++;
                await delay(Math.min(800 * Math.pow(1.5, retryAttempt), 3000));
              }
            } catch (e: any) {
              errors.push(`[${model}, err]: ${e?.message || e}`);
            }
          }
        }
        console.warn("File API generateContent cascade failed, attempting inline base64 fallback. Errors:", errors.join(" | "));
      }
    } catch (err) {
      console.warn("Error during File API processing:", err);
    } finally {
      fetch(`https://generativelanguage.googleapis.com/v1beta/${uploadedFileName}?key=${encodeURIComponent(uploadKey)}`, { method: "DELETE" }).catch(() => {});
    }
  }

  // Step B: Inline Base64 Multimodal Redundancy Fallback
  console.log("Running inline base64 multimodal OCR fallback...");
  const prompt = "Extract ALL text from this document page exactly as written. Include every word, number, table, and list. Do not summarise or add commentary.";
  
  const base64Data = buf.toString("base64");
  const payload = {
    contents: [{
      parts: [
        { inlineData: { mimeType, data: base64Data } },
        { text: prompt }
      ]
    }],
    generationConfig: { temperature: 0.1 }
  };

  const response = await geminiFetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (response.ok) {
    const data = await response.json();
    const text = (data.candidates?.[0]?.content?.parts?.[0]?.text ?? "").trim();
    if (text.length > 30) return text;
  }

  const errBody = await response.text().catch(() => "");
  throw new Error(`Gemini OCR failed (High demand 503 / API unavailable): ${errBody.substring(0, 300)}`);
}

async function nvidiaVisionOcr(buf: Buffer, extension: string): Promise<string> {
  const apiKey = Deno.env.get("NVIDIA_API_KEY");
  if (!apiKey) throw new Error("NVIDIA_API_KEY is not configured.");
  
  let mimeType = "image/jpeg";
  if (extension === "png") mimeType = "image/png";
  if (extension === "webp") mimeType = "image/webp";

  const base64Img = buf.toString("base64");
  
  const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "meta/llama-3.2-11b-vision-instruct",
      messages: [{
        role: "user",
        content: [
          { type: "text", text: "Extract ALL text from this image exactly as written. Include every word, number, table, and list. Do not summarise or add commentary." },
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Img}` } }
        ]
      }],
      temperature: 0,
      max_tokens: 2000
    })
  });
  
  if (!res.ok) throw new Error(`NVIDIA Vision API failed: ${await res.text()}`);
  const data = await res.json();
  return (data.choices?.[0]?.message?.content ?? "").trim();
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
      try {
        extractedText = await extractPdfText(buffer);
        console.log(`pdfjs extracted ${extractedText.length} chars`);
      } catch (pdfErr) {
        console.warn("pdfjs extraction encountered an issue, falling back to Gemini OCR:", pdfErr);
      }

      // Step 2: if pdfjs got nothing (scanned/image PDF), use Gemini vision OCR
      if (extractedText.length < 100) {
        console.log("pdfjs returned insufficient text — falling back to Gemini OCR...");
        try {
          extractedText = await geminiOcr(buffer, "application/pdf");
          console.log(`Gemini OCR extracted ${extractedText.length} chars`);
        } catch (ocrErr: any) {
          console.error("Gemini OCR failed:", ocrErr);
          // If pdfjs got AT LEAST some text, use whatever pdfjs got instead of hard-failing
          if (extractedText.length >= 30) {
            console.log(`Rescuing using partial pdfjs text (${extractedText.length} chars)`);
          } else {
            throw ocrErr;
          }
        }
      }
    } else if (extension === "docx") {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value.trim();
    } else if (["png", "jpg", "jpeg", "webp"].includes(extension.toLowerCase())) {
      console.log(`Using NVIDIA Llama 3.2 Vision for image (${extension})...`);
      extractedText = await nvidiaVisionOcr(buffer, extension.toLowerCase());
      console.log(`NVIDIA Vision extracted ${extractedText.length} chars`);
    } else {
      throw new Error(`Unsupported extension: ${extension}`);
    }

    if (!extractedText || extractedText.length < 30) {
      throw new Error(`Text extraction returned insufficient content (${extractedText.length} chars). The document may be empty or password-protected.`);
    }

    // Auto-tag document (best-effort using geminiFetch)
    try {
      const { data: depts } = await supabase.from("departments").select("name");
      const deptNames = depts?.map((d: any) => d.name).join(" | ") || "";
      
      const tagPrompt = `Analyze this university document and determine its target audience and department.
      Respond ONLY with a valid JSON object matching exactly this schema:
      {
        "audience": "postgraduate" | "undergraduate" | "staff" | "parent" | "all",
        "department": "${deptNames} | all"
      }
      If the document is general or applies to everyone, you MUST use "all". 
      Document:
      ${extractedText.slice(0, 3000)}`;

      const aiRes = await geminiFetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: tagPrompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });

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
      const ingestErrText = await ingestResponse.text();
      throw new Error(`Ingestion pipeline failed: ${ingestErrText}`);
    }

    const ingestResult = await ingestResponse.json();
    return Response.json({ success: true, chunks: ingestResult.chunks }, { headers: CORS });
  } catch (err: any) {
    console.error("Process Document Error:", err.stack || err.message);
    if (currentDocumentId) {
      try {
        const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
        await supabase.from("documents").update({
          processing_status: "failed",
          processing_error: String(err.message).slice(0, 500)
        }).eq("id", currentDocumentId);
      } catch { /* ignore */ }
    }
    return Response.json({ success: false, error: String(err.message || err).slice(0, 500) }, { status: 200, headers: CORS });
  }
});

