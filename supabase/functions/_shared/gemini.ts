const retryableStatuses = new Set([429, 500, 502, 503, 504]);
const modelsToTry = ["gemini-2.0-flash", "gemini-flash-latest", "gemini-1.5-flash-latest", "gemini-1.5-flash"];

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

/** Sends a Gemini request with round-robin key selection, query param key injection, and automatic model/key fallback. */
export async function geminiFetch(url: string, init: RequestInit): Promise<Response> {
  const keys = availableKeys();
  if (!keys.length) throw new Error("No Gemini API key is configured in Supabase environment.");
  
  let lastResponse: Response | undefined;
  let lastErrorText = "";

  for (const model of modelsToTry) {
    const currentUrl = url.replace(/\/models\/[^:]+:/, `/models/${model}:`);
    const start = Math.floor(Date.now() / 1000) % keys.length;

    for (let attempt = 0; attempt < keys.length; attempt++) {
      const index = (start + attempt) % keys.length;
      const key = keys[index].trim();
      const urlWithKey = currentUrl.includes("?") 
        ? `${currentUrl}&key=${encodeURIComponent(key)}`
        : `${currentUrl}?key=${encodeURIComponent(key)}`;

      const headers = new Headers(init.headers);
      headers.set("x-goog-api-key", key);
      
      try {
        lastResponse = await fetch(urlWithKey, { ...init, headers });

        if (lastResponse.ok) {
          return lastResponse;
        }

        const errBody = await lastResponse.clone().text();
        lastErrorText = errBody;
        console.error(`Gemini fetch [model: ${model}, slot: ${index + 1}, status: ${lastResponse.status}]: ${errBody}`);
      } catch (fetchErr: any) {
        console.error(`Gemini fetch network error [model: ${model}, slot: ${index + 1}]: ${fetchErr?.message || fetchErr}`);
      }
    }
  }

  if (!lastResponse) {
    throw new Error("Gemini request failed: unable to connect to Gemini API endpoints.");
  }

  return lastResponse;
}
