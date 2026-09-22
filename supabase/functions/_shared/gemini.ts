import { encodeBase64 } from "jsr:@std/encoding/base64";

export const modelsToTry = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-flash-latest",
  "gemini-2.0-flash-exp",
  "gemini-1.5-pro",
];

export function availableKeys(): string[] {
  return [
    Deno.env.get("GEMINI_API_KEY_1"),
    Deno.env.get("GEMINI_API_KEY_2"),
    Deno.env.get("GEMINI_API_KEY_3"),
    Deno.env.get("GEMINI_API_KEY_4"),
    Deno.env.get("GEMINI_API_KEY_5"),
    Deno.env.get("GEMINI_API_KEY"),
  ].filter((key): key is string => Boolean(key && key.trim()));
}

/** Delay helper for exponential backoff during retries */
export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Sends a Gemini request with round-robin key selection, query param key injection, and automatic model/key fallback. */
export async function geminiFetch(url: string, init: RequestInit): Promise<Response> {
  const keys = availableKeys();
  if (!keys.length) throw new Error("No Gemini API key is configured in Supabase environment.");
  
  const isEmbed = url.includes(":embedContent");
  const models = isEmbed 
    ? ["gemini-embedding-2", "text-embedding-004", "embedding-001"]
    : modelsToTry;

  const errors: string[] = [];
  let lastResponse: Response | undefined;
  let retryAttempt = 0;

  for (const model of models) {
    const currentUrl = url.replace(/\/models\/[^:]+:/, `/models/${model}:`);

    for (let index = 0; index < keys.length; index++) {
      const key = keys[index].trim();
      const urlWithKey = currentUrl.includes("?") 
        ? `${currentUrl}&key=${encodeURIComponent(key)}`
        : `${currentUrl}?key=${encodeURIComponent(key)}`;

      try {
        const response = await fetch(urlWithKey, {
          ...init,
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": key,
            ...(init.headers || {})
          }
        });

        if (response.ok) {
          return response;
        }

        const errText = await response.clone().text();
        errors.push(`[${model}, key ${index + 1}, status ${response.status}]: ${errText.substring(0, 150)}`);
        console.warn(`Gemini fetch attempt failed [model: ${model}, key: ${index + 1}, status: ${response.status}]: ${errText.substring(0, 200)}`);
        lastResponse = response;

        // If high demand (503), rate limit (429), or server error (500, 502, 504), wait before trying next key/model
        if ([429, 500, 502, 503, 504].includes(response.status)) {
          retryAttempt++;
          const backoff = Math.min(800 * Math.pow(1.5, retryAttempt), 3000);
          await delay(backoff);
        }
      } catch (fetchErr: any) {
        errors.push(`[${model}, key ${index + 1}, err]: ${fetchErr?.message || fetchErr}`);
      }
    }
  }

  console.error("All Gemini attempts failed:", errors.join(" | "));
  return new Response(JSON.stringify({ error: `All Gemini API attempts failed: ${errors.join(" --- ")}` }), { status: 503, headers: { "Content-Type": "application/json" } });
}

/** 
 * High-performance Gemini document processing using inline Base64 multimodal input.
 * Supports PDF documents and images directly with automatic key rotation and model fallback.
 */
export async function geminiAnalyzeDocument(
  buffer: ArrayBuffer,
  mimeType: string,
  promptText: string
): Promise<Response> {
  const base64Data = encodeBase64(new Uint8Array(buffer));

  const geminiPayload = {
    contents: [
      {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: promptText }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json"
    }
  };

  return await geminiFetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiPayload)
    }
  );
}

