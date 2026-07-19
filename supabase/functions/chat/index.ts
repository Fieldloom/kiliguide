import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const unavailable = "Sorry, I could not find this information in the university knowledge base.";
const gemini = "https://generativelanguage.googleapis.com/v1beta/models";

async function geminiJson(path: string, body: unknown) {
  const keys = [Deno.env.get("GEMINI_API_KEY_1"), Deno.env.get("GEMINI_API_KEY_2"), Deno.env.get("GEMINI_API_KEY_3"), Deno.env.get("GEMINI_API_KEY_4"), Deno.env.get("GEMINI_API_KEY_5"), Deno.env.get("GEMINI_API_KEY")].filter((key): key is string => Boolean(key));
  if (!keys.length) throw new Error("No Gemini API key is configured in Supabase secrets.");
  let response: Response | undefined;
  const start = Math.floor(Date.now() / 1000) % keys.length;
  for (let attempt = 0; attempt < keys.length; attempt++) {
    const key = keys[(start + attempt) % keys.length];
    response = await fetch(`${gemini}/${path}`, { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": key }, body: JSON.stringify(body) });
    if (response.ok || ![429, 500, 502, 503, 504].includes(response.status)) break;
  }
  if (!response || !response.ok) {
    const errText = await response?.text().catch(() => "");
    throw new Error(`Gemini request failed (${path}): ${response?.status} - ${errText}`);
  }
  return response.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization) return Response.json({ error: "Sign in is required." }, { status: 401, headers: CORS });
    
    const authClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!, { global: { headers: { Authorization: authorization } } });
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) return Response.json({ error: "Your sign-in session is invalid or expired." }, { status: 401, headers: CORS });
    
    const { question, conversationId, metadataFilter = {} } = await req.json();
    if (typeof question !== "string" || !question.trim() || question.length > 2000) return Response.json({ error: "Invalid question" }, { status: 400, headers: CORS });
    
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    let recentTurns: string[] = [];
    if (conversationId) {
      const { data: history } = await supabase.from("messages").select("role,content").eq("conversation_id", conversationId).order("created_at", { ascending: false }).limit(4);
      recentTurns = (history ?? []).reverse().map((turn: any) => `${turn.role}: ${turn.content}`);
    }

    // Generate Embedding
    const embedding = await geminiJson("gemini-embedding-2:embedContent", { content: { parts: [{ text: question }] }, output_dimensionality: 768 });
    const vector = embedding.embedding?.values || embedding.embeddings?.[0]?.values;
    if (!vector) throw new Error("No embedding generated.");

    // 1. Semantic Caching Check
    const { data: cacheHit } = await supabase.rpc("match_cached_query", { query_embedding: vector, match_threshold: 0.95 });
    if (cacheHit && cacheHit.length > 0) {
      const hit = cacheHit[0];
      if (conversationId) await supabase.from("messages").insert([{ conversation_id: conversationId, role: "user", content: question }, { conversation_id: conversationId, role: "assistant", content: hit.answer, sources: hit.sources, confidence: hit.confidence }]);
      return Response.json({ answer: hit.answer, sources: hit.sources, confidence: hit.confidence, escalate: false, debug: { provider: "CACHE", similarity: hit.similarity } }, { headers: CORS });
    }

    // 2. Hybrid Search (RRF)
    const { data: rawChunks, error } = await supabase.rpc("hybrid_search_chunks", { query_text: question, query_embedding: vector, metadata_filter: metadataFilter, match_count: 15 });
    if (error) throw error;

    // 3. Context Compression
    let finalChunks: any[] = [];
    if (rawChunks && rawChunks.length > 0) {
      const docMap = new Map<string, any[]>();
      for (const chunk of rawChunks) {
        if (!docMap.has(chunk.document_id)) docMap.set(chunk.document_id, []);
        docMap.get(chunk.document_id)!.push(chunk);
      }
      for (const [_, docChunks] of docMap.entries()) {
        docChunks.sort((a, b) => a.chunk_index - b.chunk_index);
        let currentChunk = { ...docChunks[0] };
        for (let i = 1; i < docChunks.length; i++) {
          const next = docChunks[i];
          if (next.chunk_index === currentChunk.chunk_index + 1) {
            currentChunk.content += "\n\n" + next.content;
            currentChunk.chunk_index = next.chunk_index; 
          } else {
            finalChunks.push(currentChunk);
            currentChunk = { ...next };
          }
        }
        finalChunks.push(currentChunk);
      }
      finalChunks.sort((a, b) => b.similarity - a.similarity);
      finalChunks = finalChunks.slice(0, 6);
    }

    let context = "";
    let confidence = 0;
    let sources: any[] = [];

    const isGreeting = /^(hi|hello|hey|greetings|help|who are you|what can you do)[\s\W]*$/i.test(question);

    if (finalChunks.length > 0 && !isGreeting) { // Trust the hybrid search ranking
      context = finalChunks.map((chunk: any, index: number) => `[${index + 1}] ${chunk.content}`).join("\n\n");
      confidence = finalChunks[0].similarity;
      sources = finalChunks.map((chunk: any) => ({ title: chunk.title, page: chunk.page_number }));
    }

    // 4. Confidence-based LLM Bypass
    const isFactual = !/summarize|compare|list|explain|write|generate/i.test(question);
    if (finalChunks.length > 0 && finalChunks[0].similarity > 0.85 && isFactual) {
      const answer = `Extracted directly from documentation:\n\n${finalChunks[0].content}`;
      if (conversationId) await supabase.from("messages").insert([{ conversation_id: conversationId, role: "user", content: question }, { conversation_id: conversationId, role: "assistant", content: answer, sources, confidence }]);
      return Response.json({ answer, sources, confidence, escalate: false, debug: { provider: "DIRECT_BYPASS", similarity: finalChunks[0].similarity } }, { headers: CORS });
    }

    const instruction = `You are KiliGuide, a smart-campus assistant for DeKUT (Dedan Kimathi University of Technology).
Your capabilities: You can answer questions about the university based on official documents, check timetables, and help with campus notices.
Rules for answering:
1. **Multilingual**: You MUST reply in the EXACT same language that the user asks the question in (e.g., Swahili, French, English).
2. If the user is just greeting you or asking what you can do, be friendly, concise, and explain your capabilities in their language.
3. If CONTEXT is provided below, use it to answer the question. Cite using [n] notation.
4. If the CONTEXT does not contain relevant information for a factual university question, politely say you cannot find the answer and suggest they contact support. Set "escalate" to true.
5. Never invent facts. Only answer from the CONTEXT or for greetings/general questions.
6. Return your response strictly as JSON with this schema: {"answer":"your text response here", "escalate": boolean}

CONTEXT:
${context || "(No relevant documents found for this question)"}`;

    let jsonStr = "{}";
    let providerUsed = "none";

    const groqKey = Deno.env.get("GROQ_API_KEY");
    if (groqKey && providerUsed === "none") {
      try {
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${groqKey}` },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: instruction },
              ...recentTurns.map(t => {
                const isUser = t.startsWith("user:");
                return { role: isUser ? "user" : "assistant", content: t.substring(isUser ? 6 : 11) };
              }),
              { role: "user", content: question }
            ],
            temperature: 0,
            max_tokens: 2000,
            response_format: { type: "json_object" }
          })
        });
        if (groqRes.ok) {
          const data = await groqRes.json();
          jsonStr = data.choices?.[0]?.message?.content?.trim() || "{}";
          providerUsed = "GROQ";
        }
      } catch (e: any) {}
    }

    if (providerUsed === "none") {
      const contents = [
        ...recentTurns.map(t => {
          const isUser = t.startsWith("user:");
          return { role: isUser ? "user" : "model", parts: [{ text: t.substring(isUser ? 6 : 11) }] };
        }),
        { role: "user", parts: [{ text: question }] }
      ];
      const completion = await geminiJson("gemini-flash-latest:generateContent", { system_instruction: { parts: [{ text: instruction }] }, contents, generationConfig: { temperature: 0, maxOutputTokens: 2000, responseMimeType: "application/json", responseSchema: { type: "OBJECT", properties: { answer: { type: "STRING" }, escalate: { type: "BOOLEAN" } }, required: ["answer", "escalate"] } } });
      jsonStr = completion.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "{}";
      providerUsed = "GEMINI";
    }

    const cleanJson = jsonStr.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    let answer = unavailable;
    let escalate = false;
    let parseError = null;
    try {
      const parsed = JSON.parse(cleanJson);
      if (parsed.answer != null && parsed.answer !== "") answer = String(parsed.answer);
      if (parsed.escalate) escalate = true;
    } catch (e: any) {
      parseError = e.message;
    }

    if (escalate && answer === unavailable) {
      answer = "I found your document in the knowledge base but could not extract a clear answer. Please try rephrasing your question or contact support for assistance.";
    }

    // 5. Cache Write
    if (answer !== unavailable && !escalate && providerUsed !== "none") {
      supabase.from("query_cache").insert({
        query: question,
        embedding: vector,
        answer,
        sources,
        confidence,
        metadata: metadataFilter
      }).then();
    }

    if (conversationId) await supabase.from("messages").insert([{ conversation_id: conversationId, role: "user", content: question }, { conversation_id: conversationId, role: "assistant", content: answer, sources, confidence }]);
    return Response.json({ answer, sources, confidence, escalate, debug: { jsonStr: jsonStr.slice(0, 300), parseError, provider: providerUsed, contextLength: context.length } }, { headers: CORS });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to process request";
    return Response.json({ error: message }, { status: 500, headers: CORS });
  }
});
