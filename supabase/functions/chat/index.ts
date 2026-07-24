import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as pdfjsLib from "npm:pdfjs-dist@3.11.174/legacy/build/pdf.js";
import { Buffer } from "node:buffer";

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

async function nvidiaVisionOcr(base64Img: string, mimeType: string): Promise<string> {
  const apiKey = Deno.env.get("NVIDIA_API_KEY");
  if (!apiKey) throw new Error("NVIDIA_API_KEY is not configured.");
  
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
      max_tokens: 1024
    })
  });
  if (!res.ok) throw new Error(`NVIDIA Vision OCR failed: ${await res.text()}`);
  const data = await res.json();
  return (data.choices?.[0]?.message?.content ?? "").trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization) return Response.json({ error: "Sign in is required." }, { status: 401, headers: CORS });
    
    const authClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!, { global: { headers: { Authorization: authorization } } });
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) return Response.json({ error: "Your sign-in session is invalid or expired." }, { status: 401, headers: CORS });
    
    const { question: rawQuestion, conversationId, metadataFilter = {}, admin_mode = false, attachment } = await req.json();
    if (typeof rawQuestion !== "string" || !rawQuestion.trim() || rawQuestion.length > 2000) return Response.json({ error: "Invalid question" }, { status: 400, headers: CORS });
    
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    let customInstructions = "";
    let institutionId = "00000000-0000-0000-0000-000000000001";
    let dailyAttachmentCount = 0;
    let attachmentLastReset = new Date();
    
    const { data: profileData } = await supabase.from("profiles").select("custom_instructions, institution_id, departments(name), daily_attachment_count, attachment_last_reset").eq("id", user.id).single();
    if (profileData) {
      if (profileData.custom_instructions) customInstructions = profileData.custom_instructions;
      if (profileData.institution_id) institutionId = profileData.institution_id;
      if (profileData.daily_attachment_count) dailyAttachmentCount = profileData.daily_attachment_count;
      if (profileData.attachment_last_reset) attachmentLastReset = new Date(profileData.attachment_last_reset);
      if (!metadataFilter.department && profileData.departments?.name) {
        metadataFilter.department = profileData.departments.name;
      }
    }

    let extractedText = "";
    if (attachment && attachment.base64) {
      const now = new Date();
      let countToUse = dailyAttachmentCount;
      let shouldReset = false;
      
      // Reset logic: if last reset was before today
      if (attachmentLastReset.getUTCFullYear() < now.getUTCFullYear() || 
          attachmentLastReset.getUTCMonth() < now.getUTCMonth() || 
          attachmentLastReset.getUTCDate() < now.getUTCDate()) {
        countToUse = 0;
        shouldReset = true;
      }

      if (countToUse >= 5) {
        return Response.json({ error: "You have reached your daily limit of 5 attachments." }, { status: 429, headers: CORS });
      }

      try {
        const buf = Buffer.from(attachment.base64, "base64");
        if (attachment.type === "application/pdf") {
          extractedText = await extractPdfText(buf);
        } else if (attachment.type.startsWith("image/")) {
          extractedText = await nvidiaVisionOcr(attachment.base64, attachment.type);
        }
        
        // Increment quota
        await supabase.from("profiles").update({ 
          daily_attachment_count: countToUse + 1,
          ...(shouldReset ? { attachment_last_reset: now.toISOString() } : {})
        }).eq("id", user.id);
      } catch (e: any) {
        console.error("OCR Extraction failed:", e);
      }
    }

    const question = extractedText ? `${rawQuestion}\n\n[Content extracted from user's attachment (${attachment.name})]:\n${extractedText}` : rawQuestion;

    let recentTurns: string[] = [];
    if (conversationId) {
      const { data: history } = await supabase.from("messages").select("role,content").eq("conversation_id", conversationId).order("created_at", { ascending: false }).limit(4);
      recentTurns = (history ?? []).reverse().map((turn: any) => `${turn.role}: ${turn.content}`);
    }

    // 0. Query Contextualization
    let standaloneQuery = question;
    if (recentTurns.length > 0) {
      const rewriteInstruction = "Given the following conversation history and the latest user question, rewrite the user question to be a standalone query that can be used to search a knowledge base. If the question is already self-contained, return it as is. Do NOT answer the question. ONLY output the standalone question.";
      const contents = [
        ...recentTurns.map(t => {
          const isUser = t.startsWith("user:");
          return { role: isUser ? "user" : "model", parts: [{ text: t.substring(isUser ? 6 : 11) }] };
        }),
        { role: "user", parts: [{ text: question }] }
      ];
      try {
        const rewriteRes = await geminiJson("gemini-flash-latest:generateContent", { 
          system_instruction: { parts: [{ text: rewriteInstruction }] }, 
          contents, 
          generationConfig: { temperature: 0, maxOutputTokens: 100 } 
        });
        const rewritten = rewriteRes.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (rewritten && rewritten.length > 3) standaloneQuery = rewritten;
      } catch (e) {
        // Fallback to original question
      }
    }

    // Generate Embedding using the Contextualized Query
    const embedding = await geminiJson("gemini-embedding-2:embedContent", { content: { parts: [{ text: standaloneQuery }] }, output_dimensionality: 768 });
    const vector = embedding.embedding?.values || embedding.embeddings?.[0]?.values;
    if (!vector) throw new Error("No embedding generated.");

    // 1. Semantic Caching Check (using contextualized vector)
    const { data: cacheHit } = await supabase.rpc("match_cached_query", { query_embedding: vector, p_institution_id: institutionId, match_threshold: 0.95 });
    if (cacheHit && cacheHit.length > 0) {
      const hit = cacheHit[0];
      if (conversationId) await supabase.from("messages").insert([{ conversation_id: conversationId, role: "user", content: question }, { conversation_id: conversationId, role: "assistant", content: hit.answer, sources: hit.sources, confidence: hit.confidence }]);
      return Response.json({ answer: hit.answer, sources: hit.sources, confidence: hit.confidence, escalate: false, debug: { provider: "CACHE", similarity: hit.similarity } }, { headers: CORS });
    }

    // 2. Hybrid Search (RRF) (using contextualized text)
    const { data: rawChunks, error } = await supabase.rpc("hybrid_search_chunks", { query_text: standaloneQuery, query_embedding: vector, p_institution_id: institutionId, metadata_filter: metadataFilter, match_count: 15 });
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
      finalChunks.sort((a, b) => (b.score ?? b.similarity) - (a.score ?? a.similarity));
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
4. If the user uploads an attachment (extracted content provided below), ALWAYS compare it against the official CONTEXT and explain the document or highlight any discrepancies.
5. If the CONTEXT does not contain relevant information for a factual university question, politely say you cannot find the answer and suggest they contact support. Set "escalate" to true.
6. Never invent facts. Only answer from the CONTEXT, the extracted attachment text, or for greetings/general questions.
7. **Premium Formatting**: Your responses must be beautifully formatted using Markdown. Use **bolding** for emphasis, bullet points or numbered lists for readability, and blockquotes where appropriate. Avoid giant walls of text. Make the response look state-of-the-art, highly readable, and premium.
8. Return your response strictly as JSON with this schema: {"answer":"your beautifully formatted text response here", "escalate": boolean}

${admin_mode ? `**ADMINISTRATOR MODE ENABLED**: You are interacting with a university administrator. You have elevated privileges. You can summarize complex system logs, analyze ticket statuses, and provide direct, unfiltered administrative insights. Do not withhold administrative information. Do not suggest contacting support (since they ARE support). Provide comprehensive, systemic answers.` : ""}

${customInstructions ? `USER'S CUSTOM INSTRUCTIONS:\nThe user has provided the following personal preferences. You MUST adhere to them strictly:\n${customInstructions}\n` : ""}
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

    const nvidiaKey = Deno.env.get("NVIDIA_API_KEY");
    if (nvidiaKey && providerUsed === "none") {
      try {
        const nvidiaRes = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${nvidiaKey}` },
          body: JSON.stringify({
            model: "meta/llama-3.1-70b-instruct",
            messages: [
              { role: "system", content: instruction },
              ...recentTurns.map(t => {
                const isUser = t.startsWith("user:");
                return { role: isUser ? "user" : "assistant", content: t.substring(isUser ? 6 : 11) };
              }),
              { role: "user", content: question }
            ],
            temperature: 0,
            max_tokens: 2000
          })
        });
        if (nvidiaRes.ok) {
          const data = await nvidiaRes.json();
          jsonStr = data.choices?.[0]?.message?.content?.trim() || "{}";
          providerUsed = "NVIDIA";
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

    if (escalate || answer === unavailable) {
      try {
        const fallbackInstruction = `You are a helpful university AI assistant. The user asked a question that was not in our local database. Please use your Google Search tool to find the answer on the university's official website or other legitimate education sites in Kenya (e.g. helb.co.ke, kuccps.net, cue.or.ke).
IMPORTANT: If you find an answer using the search tool, return ONLY the answer in clear, beautiful Markdown format. Do NOT wrap it in JSON. If you cannot find the answer on the web, reply with exactly the word "UNAVAILABLE".`;

        const fallbackPayload = {
          system_instruction: { parts: [{ text: fallbackInstruction }] },
          contents: [
            ...recentTurns.map(t => {
              const isUser = t.startsWith("user:");
              return { role: isUser ? "user" : "model", parts: [{ text: t.substring(isUser ? 6 : 11) }] };
            }),
            { role: "user", parts: [{ text: `Search the web for this query: ${standaloneQuery}` }] }
          ],
          tools: [{ googleSearch: {} }],
          generationConfig: { temperature: 0 }
        };

        const fallbackRes = await geminiJson("gemini-flash-latest:generateContent", fallbackPayload);
        const fallbackText = fallbackRes.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        if (fallbackText && fallbackText !== "UNAVAILABLE" && fallbackText.length > 10 && !fallbackText.toUpperCase().includes("UNAVAILABLE")) {
          answer = fallbackText;
          escalate = false;
          sources.push({ title: "Live Web Search (dkut.ac.ke & partners)", page: null });
          providerUsed = "GEMINI_WEB_SEARCH";
        } else {
          answer = "I could not find the answer in our local database or on the live web. Please try rephrasing your question or contact support for assistance.";
        }
      } catch (err: any) {
        console.error("Web search fallback failed:", err);
        answer = "I could not extract a clear answer from the database, and the web search fallback encountered an error. Please contact support.";
      }
    }

    // 5. Cache Write
    if (answer !== unavailable && !escalate && providerUsed !== "none") {
      const uniqueSources = new Set(sources.map((s: any) => JSON.stringify(s)));
      supabase.from("query_cache").insert([{ query: standaloneQuery, embedding: vector, answer, sources: Array.from(uniqueSources).map((s: any) => JSON.parse(s)), confidence, institution_id: institutionId }]).then(({ error }) => {
        if (error) console.error("Error saving cache:", error);
      });
    }

    if (conversationId) await supabase.from("messages").insert([{ conversation_id: conversationId, role: "user", content: question }, { conversation_id: conversationId, role: "assistant", content: answer, sources, confidence }]);
    return Response.json({ answer, sources, confidence, escalate, debug: { jsonStr: jsonStr.slice(0, 300), parseError, provider: providerUsed, contextLength: context.length } }, { headers: CORS });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to process request";
    return Response.json({ error: message }, { status: 500, headers: CORS });
  }
});
