// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
declare const Deno: any;

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

function availableKeys() {
  return [
    Deno.env.get("GEMINI_API_KEY_1"),
    Deno.env.get("GEMINI_API_KEY_2"),
    Deno.env.get("GEMINI_API_KEY_3"),
    Deno.env.get("GEMINI_API_KEY_4"),
    Deno.env.get("GEMINI_API_KEY_5"),
    Deno.env.get("GEMINI_API_KEY"),
  ].filter((key): key is string => Boolean(key && key.trim()));
}

function chunkText(text: string, size = 2500) {
  const clean = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  const paragraphs = clean.split("\n\n");
  
  const chunks: string[] = [];
  let currentChunk = "";
  let activeHeader = "General Context";

  for (let i = 0; i < paragraphs.length; i++) {
    let p = paragraphs[i].trim();
    if (!p) continue;

    const isHeader = p.length < 80 && !p.match(/[.!?]$/);
    if (isHeader) {
      activeHeader = p;
    }

    let textToAppend = p;
    if (currentChunk.length === 0 && activeHeader !== "General Context" && !isHeader) {
      textToAppend = `Section Topic: ${activeHeader}\n\n${p}`;
    } else if (currentChunk.length === 0 && isHeader) {
      textToAppend = `Section Topic: ${p}`;
    }

    if (currentChunk.length + textToAppend.length > size && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = activeHeader !== p ? `Section Topic: ${activeHeader}\n\n${p}` : `Section Topic: ${p}`;
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + textToAppend;
    }
  }
  
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks.filter((chunk) => chunk.length > 80);
}

async function embed(text: string): Promise<number[]> {
  const keys = availableKeys();
  if (!keys.length) throw new Error("No Gemini API key is configured.");
  
  const embeddingModels = ["gemini-embedding-2", "text-embedding-004", "embedding-001"];
  const errors: string[] = [];

  for (const model of embeddingModels) {
    for (let index = 0; index < keys.length; index++) {
      const key = keys[index].trim();
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${encodeURIComponent(key)}`;
      
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": key },
          body: JSON.stringify({
            content: { parts: [{ text: `Represent this university document for retrieval: ${text}` }] },
            output_dimensionality: 768
          })
        });

        if (response.ok) {
          const body = await response.json();
          const vec = body.embedding?.values || body.embeddings?.[0]?.values;
          if (vec && Array.isArray(vec)) return vec as number[];
        }

        const errText = await response.text();
        errors.push(`[${model}, key ${index + 1}, status ${response.status}]: ${errText.substring(0, 100)}`);
      } catch (err: any) {
        errors.push(`[${model}, key ${index + 1}, err]: ${err?.message || err}`);
      }
    }
  }

  throw new Error(`All embedding model attempts failed: ${errors.join(" | ")}`);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const { documentId, text, pageNumber } = await req.json();
    if (typeof documentId !== "string" || typeof text !== "string" || text.length < 80) {
      return Response.json({ error: "A document ID and extracted text (min 80 chars) are required." }, { status: 400, headers: CORS });
    }
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: document } = await supabase.from("documents").select("id,title").eq("id", documentId).single();
    if (!document) return Response.json({ error: "Document not found." }, { status: 404, headers: CORS });
    
    await supabase.from("document_chunks").delete().eq("document_id", documentId);
    const chunks = chunkText(text);
    if (chunks.length === 0) {
      return Response.json({ error: "Extracted text resulted in 0 valid chunks. Text was: " + text.slice(0, 200) }, { status: 400, headers: CORS });
    }

    for (let index = 0; index < chunks.length; index++) {
      const enrichedChunk = `Document Title: ${document.title}\n\n${chunks[index]}`;
      const { data: inserted, error } = await supabase.from("document_chunks").insert({ document_id: documentId, content: enrichedChunk, page_number: pageNumber ?? null, chunk_index: index }).select("id").single();
      if (error) throw error;
      
      const vector = await embed(enrichedChunk);
      if (!vector) throw new Error("No embedding returned");
      
      const { error: vectorError } = await supabase.from("embeddings").insert({ chunk_id: inserted.id, embedding: vector });
      if (vectorError) throw vectorError;
    }

    await supabase.from("documents").update({ processing_status: "ready", chunk_count: chunks.length }).eq("id", documentId);
    const { data: publication } = await supabase.from("documents").select("notify_on_ready").eq("id", documentId).single();
    if (publication?.notify_on_ready) {
      await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/publish-update`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`, "Content-Type": "application/json" },
        body: JSON.stringify({ documentId })
      });
    }

    return Response.json({ success: true, documentId, chunks: chunks.length, status: "ready" }, { headers: CORS });
  } catch (err: any) {
    console.error("Ingest error:", err);
    return Response.json({ success: false, error: err?.message || String(err) }, { status: 500, headers: CORS });
  }
});
