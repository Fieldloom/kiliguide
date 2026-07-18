import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { geminiFetch } from "../_shared/gemini.ts";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const unavailable = "Sorry, I could not find this information in the university knowledge base.";
const gemini = "https://generativelanguage.googleapis.com/v1beta/models";
const socialMessage = /^(hi|hello|hey|habari|mambo|good (morning|afternoon|evening)|how are you|help)$/i;

async function geminiJson(path: string, body: unknown) {
  const response = await geminiFetch(`${gemini}/${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!response.ok) throw new Error("Gemini request failed");
  return response.json();
}

async function optimizeRetrievalQuery(question: string, recentTurns: string[]) {
  const prompt = `You prepare a search query for a university RAG system. Return only one concise semantic search query. Preserve the user's intent, names, dates, programme details and language. Use the recent conversation only to resolve references such as "that", "it" or "the deadline". Never answer the question and never invent facts.\n\nRECENT TURNS:\n${recentTurns.join("\n") || "None"}\n\nUSER QUESTION:\n${question}`;
  const result = await geminiJson("gemini-2.5-flash:generateContent", { contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { temperature: 0, maxOutputTokens: 100 } });
  return result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || question;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization) return Response.json({ error: "Sign in is required." }, { status: 401, headers: CORS });
    const authClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!, { global: { headers: { Authorization: authorization } } });
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) return Response.json({ error: "Your sign-in session is invalid or expired." }, { status: 401, headers: CORS });
    const { question, conversationId } = await req.json();
    if (typeof question !== "string" || !question.trim() || question.length > 2000) return Response.json({ error: "Invalid question" }, { status: 400, headers: CORS });
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    if (socialMessage.test(question.trim())) {
      const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
      const firstName = profile?.full_name?.trim().split(/\s+/)[0] || "there";
      const welcome = await geminiJson("gemini-2.5-flash:generateContent", { system_instruction: { parts: [{ text: "You are KiliGuide, a warm DeKUT campus assistant. Reply naturally in the user's language, in at most two short sentences. You may greet and offer help, but do not state any factual university policy, date, fee, rule, or procedure because sources have not been retrieved yet." }] }, contents: [{ role: "user", parts: [{ text: `The signed-in user's first name is ${firstName}. Their message is: ${question}` }] }], generationConfig: { temperature: 0.5, maxOutputTokens: 120 } });
      const answer = welcome.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (!answer) throw new Error("Gemini did not return a conversational response.");
      if (conversationId) await supabase.from("messages").insert([{ conversation_id: conversationId, role: "user", content: question }, { conversation_id: conversationId, role: "assistant", content: answer, sources: [], confidence: 1 }]);
      return Response.json({ answer, sources: [], confidence: 1, mode: "conversation" }, { headers: CORS });
    }
    let recentTurns: string[] = [];
    if (conversationId) {
      const { data: history } = await supabase.from("messages").select("role,content").eq("conversation_id", conversationId).order("created_at", { ascending: false }).limit(4);
      recentTurns = (history ?? []).reverse().map((turn: any) => `${turn.role}: ${turn.content}`);
    }
    const retrievalQuery = await optimizeRetrievalQuery(question, recentTurns);
    const embedding = await geminiJson("gemini-embedding-2:embedContent", { content: { parts: [{ text: retrievalQuery }] }, output_dimensionality: 768 });
    const vector = embedding.embeddings?.[0]?.values;
    if (!vector) throw new Error("No embedding generated");
    const { data: chunks, error } = await supabase.rpc("match_document_chunks", { query_embedding: vector, match_count: 6 });
    if (error) throw error;
    if (!chunks?.length || chunks[0].similarity < 0.68) return Response.json({ answer: unavailable, sources: [], confidence: 0 }, { headers: CORS });
    const context = chunks.map((chunk: any, index: number) => `[${index + 1}] ${chunk.content}`).join("\n\n");
    const instruction = `You are KiliGuide, a safe university information assistant. Answer only from the supplied CONTEXT. Never invent, infer, or use outside knowledge. Cite claims using [n]. If the context is insufficient, respond exactly: ${unavailable}\n\nCONTEXT:\n${context}`;
    const completion = await geminiJson("gemini-2.5-flash:generateContent", { system_instruction: { parts: [{ text: instruction }] }, contents: [{ role: "user", parts: [{ text: question }] }], generationConfig: { temperature: 0, maxOutputTokens: 700 } });
    const answer = completion.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || unavailable;
    const sources = chunks.map((chunk: any) => ({ title: chunk.title, page: chunk.page_number }));
    if (conversationId) await supabase.from("messages").insert([{ conversation_id: conversationId, role: "user", content: question }, { conversation_id: conversationId, role: "assistant", content: answer, sources, confidence: chunks[0].similarity }]);
    return Response.json({ answer, sources, confidence: chunks[0].similarity, retrievalQuery }, { headers: CORS });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to process request";
    console.error("KiliGuide chat failed:", message);
    return Response.json({ error: message }, { status: 500, headers: CORS });
  }
});
