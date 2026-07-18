import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const unavailable = "Sorry, I could not find this information in the university knowledge base.";
const gemini = "https://generativelanguage.googleapis.com/v1beta/models";

async function geminiJson(path: string, body: unknown) {
  const keys = [Deno.env.get("GEMINI_API_KEY_1"),Deno.env.get("GEMINI_API_KEY_2"),Deno.env.get("GEMINI_API_KEY_3"),Deno.env.get("GEMINI_API_KEY_4"),Deno.env.get("GEMINI_API_KEY_5"),Deno.env.get("GEMINI_API_KEY")].filter((key): key is string => Boolean(key));
  if (!keys.length) throw new Error("No Gemini API key is configured in Supabase secrets.");
  let response: Response | undefined;
  const start = Math.floor(Date.now() / 1000) % keys.length;
  for (let attempt = 0; attempt < keys.length; attempt++) {
    const key = keys[(start + attempt) % keys.length];
    response = await fetch(`${gemini}/${path}`, { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": key }, body: JSON.stringify(body) });
    if (response.ok || ![429,500,502,503,504].includes(response.status)) break;
  }
  if (!response || !response.ok) {
    const errText = await response?.text().catch(() => "");
    throw new Error(`Gemini request failed (${path}): ${response?.status} - ${errText}`);
  }
  return response.json();
}

async function optimizeRetrievalQuery(question: string, recentTurns: string[]) {
  const prompt = `You prepare a search query for a university RAG system. Return only one concise semantic search query. Preserve the user's intent, names, dates, programme details and language. Use the recent conversation only to resolve references such as "that", "it" or "the deadline". Never answer the question and never invent facts.\n\nRECENT TURNS:\n${recentTurns.join("\n") || "None"}\n\nUSER QUESTION:\n${question}`;
  const result = await geminiJson("gemini-flash-latest:generateContent", { contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { temperature: 0, maxOutputTokens: 100 } });
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
    
    let recentTurns: string[] = [];
    if (conversationId) {
      const { data: history } = await supabase.from("messages").select("role,content").eq("conversation_id", conversationId).order("created_at", { ascending: false }).limit(4);
      recentTurns = (history ?? []).reverse().map((turn: any) => `${turn.role}: ${turn.content}`);
    }
    
    const retrievalQuery = await optimizeRetrievalQuery(question, recentTurns);
    const embedding = await geminiJson("gemini-embedding-2:embedContent", { content: { parts: [{ text: retrievalQuery }] }, output_dimensionality: 768 });
    const vector = embedding.embedding?.values || embedding.embeddings?.[0]?.values;
    if (!vector) throw new Error("No embedding generated. Response: " + JSON.stringify(embedding));
    
    const { data: chunks, error } = await supabase.rpc("match_document_chunks", { query_embedding: vector, match_count: 6 });
    if (error) throw error;
    
    let context = "";
    let confidence = 0;
    let sources: any[] = [];
    
    if (chunks?.length && chunks[0].similarity >= 0.65) {
      context = chunks.map((chunk: any, index: number) => `[${index + 1}] ${chunk.content}`).join("\n\n");
      confidence = chunks[0].similarity;
      sources = chunks.map((chunk: any) => ({ title: chunk.title, page: chunk.page_number }));
    }
    
    const instruction = `You are KiliGuide, a smart-campus assistant for DeKUT university.
Your capabilities: You can answer questions about the university based on official documents, check timetables, and help with campus notices.
Rules for answering:
1. **Multilingual**: You MUST reply in the EXACT same language that the user asks the question in (e.g., Swahili, French, English).
2. If the user is just greeting you or asking what you can do, be friendly, concise, and explain your capabilities in their language.
3. If the user asks about a university policy, deadline, fee, rule, or specific fact, you MUST ONLY answer if the answer is found in the CONTEXT below.
4. **Escalation**: If the CONTEXT is empty or insufficient to answer a factual question, OR if the user explicitly asks to speak to a human or contact support, you must politely explain that you cannot find the answer and suggest they contact support. Set the "escalate" flag to true in the JSON response.
5. Cite the CONTEXT using [n] notation when answering factual university questions.
6. Return your response strictly as JSON with this schema: {"answer":"your text response here", "escalate": boolean}

CONTEXT:
${context}`;

    const completion = await geminiJson("gemini-flash-latest:generateContent", { system_instruction: { parts: [{ text: instruction }] }, contents: [{ role: "user", parts: [{ text: question }] }], generationConfig: { temperature: 0, maxOutputTokens: 700, responseMimeType: "application/json" } });
    const jsonStr = completion.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "{}";
    let answer = unavailable;
    let escalate = false;
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.answer) answer = parsed.answer;
      if (parsed.escalate) escalate = true;
    } catch(e) {}
    
    if (conversationId) await supabase.from("messages").insert([{ conversation_id: conversationId, role: "user", content: question }, { conversation_id: conversationId, role: "assistant", content: answer, sources, confidence }]);
    return Response.json({ answer, sources, confidence, retrievalQuery, escalate }, { headers: CORS });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to process request";
    console.error("KiliGuide chat failed:", message);
    return Response.json({ error: message }, { status: 500, headers: CORS });
  }
});
