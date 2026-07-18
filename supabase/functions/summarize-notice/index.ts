import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { geminiFetch } from "../_shared/gemini.ts";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const { noticeId, body } = await req.json();
    if (typeof body !== "string" || body.length < 20) return Response.json({ error: "Notice content is required." }, { status: 400, headers: CORS });
    const response = await geminiFetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: `Summarize this official university notice in no more than 5 concise bullet points. List explicit deadlines and dates separately. Do not add information. Return JSON only: {"summary":"...","dates":["..."]}.\n\nNOTICE:\n${body}` }] }], generationConfig: { temperature: 0, responseMimeType: "application/json" } }) });
    if (!response.ok) throw new Error("Gemini request failed");
    const result = await response.json();
    const json = JSON.parse(result.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}");
    if (noticeId) { const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!); await supabase.from("notices").update({ summary: json.summary ?? "", important_dates: json.dates ?? [] }).eq("id", noticeId); }
    return Response.json(json, { headers: CORS });
  } catch { return Response.json({ error: "Unable to summarize notice." }, { status: 500, headers: CORS }); }
});
