import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const gemini = "https://generativelanguage.googleapis.com/v1beta/models";

async function geminiJson(path: string, body: unknown) {
  const keys = [Deno.env.get("GEMINI_API_KEY_1"), Deno.env.get("GEMINI_API_KEY_2"), Deno.env.get("GEMINI_API_KEY_3"), Deno.env.get("GEMINI_API_KEY_4"), Deno.env.get("GEMINI_API_KEY_5"), Deno.env.get("GEMINI_API_KEY")].filter((key): key is string => Boolean(key));
  if (!keys.length) throw new Error("No Gemini API key is configured.");
  let response: Response | undefined;
  const start = Math.floor(Date.now() / 1000) % keys.length;
  for (let attempt = 0; attempt < keys.length; attempt++) {
    const key = keys[(start + attempt) % keys.length];
    response = await fetch(`${gemini}/${path}`, { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": key }, body: JSON.stringify(body) });
    if (response.ok || ![429, 500, 502, 503, 504].includes(response.status)) break;
  }
  if (!response || !response.ok) {
    const errText = await response?.text().catch(() => "");
    throw new Error(`Gemini request failed: ${response?.status} - ${errText}`);
  }
  return response.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization) return Response.json({ error: "Unauthorized" }, { status: 401, headers: CORS });
    
    const { ticket, departments } = await req.json();
    if (!ticket || !departments) return Response.json({ error: "Missing payload" }, { status: 400, headers: CORS });

    const instruction = `You are KiliGuide's intelligent ticket escalation system for Dedan Kimathi University of Technology.
Your job is to read a student support ticket and output exactly two things:
1. The most appropriate department to escalate this issue to (from the provided list of official departments).
2. A highly professional, well-written email body that the Super Admin will send to that department. The email should concisely summarize the student's issue, provide any necessary context, and request assistance. Start directly with the body (e.g. "We have received a ticket from a student regarding..."). Do not include greeting/salutations like "Dear X" or sign-offs like "Sincerely," because the Admin's mail client will handle that.

Here is the student ticket:
Subject: ${ticket.subject}
From: ${ticket.authorName}
Description:
${ticket.description}

Here are the available departments:
${departments.map((d: any) => `- ID: ${d.id} | Name: ${d.name} | Email: ${d.email}`).join("\n")}

Respond ONLY with a raw JSON object formatted exactly like this:
{
  "department_id": "the exact ID string from the list above",
  "department_email": "the exact email from the list above",
  "body": "The perfectly written professional escalation email body."
}
`;

    const contents = [{ role: "user", parts: [{ text: instruction }] }];
    const completion = await geminiJson("gemini-flash-latest:generateContent", { 
      system_instruction: { parts: [{ text: "You are a helpful JSON-only API." }] }, 
      contents, 
      generationConfig: { 
        temperature: 0.1, 
        responseMimeType: "application/json", 
        responseSchema: { 
          type: "OBJECT", 
          properties: { 
            department_id: { type: "STRING" }, 
            department_email: { type: "STRING" }, 
            body: { type: "STRING" } 
          }, 
          required: ["department_id", "department_email", "body"] 
        } 
      } 
    });
    
    const jsonStr = completion.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "{}";
    const cleanJson = jsonStr.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const result = JSON.parse(cleanJson);

    return Response.json(result, { headers: CORS });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to process request";
    return Response.json({ error: message }, { status: 500, headers: CORS });
  }
});
