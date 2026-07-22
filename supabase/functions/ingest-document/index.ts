import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { geminiFetch } from "../_shared/gemini.ts";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const gemini = "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent";

function chunkText(text: string, size = 2800, overlap = 400) {
  const clean = text.replace(/\s+/g, " ").trim();
  const chunks: string[] = [];
  for (let start = 0; start < clean.length; start += size - overlap) chunks.push(clean.slice(start, start + size));
  return chunks.filter((chunk) => chunk.length > 80);
}

async function embed(text: string) {
  const response = await geminiFetch(gemini, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: { parts: [{ text: `Represent this university document for retrieval: ${text}` }] }, output_dimensionality: 768 }) });
  if (!response.ok) throw new Error("Embedding request failed");
  const body = await response.json();
  return (body.embedding?.values || body.embeddings?.[0]?.values) as number[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const { documentId, text, pageNumber } = await req.json();
    if (typeof documentId !== "string" || typeof text !== "string" || text.length < 80) return Response.json({ error: "A document ID and extracted text are required." }, { status: 400, headers: CORS });
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: document } = await supabase.from("documents").select("id,title").eq("id", documentId).single();
    if (!document) return Response.json({ error: "Document not found." }, { status: 404, headers: CORS });
    await supabase.from("document_chunks").delete().eq("document_id", documentId);
    const chunks = chunkText(text);
    if (chunks.length === 0) {
      return Response.json({ error: "Extracted text was too short or just whitespace. Text was: " + text.slice(0, 200) }, { status: 400, headers: CORS });
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
      await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/publish-update`, { method: "POST", headers: { "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`, "Content-Type": "application/json" }, body: JSON.stringify({ documentId }) });
    }
    return Response.json({ documentId, chunks: chunks.length, status: "ready" }, { headers: CORS });
  } catch {
    return Response.json({ error: "Document ingestion failed." }, { status: 500, headers: CORS });
  }
});
