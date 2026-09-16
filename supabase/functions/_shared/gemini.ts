const retryableStatuses = new Set([429, 500, 502, 503, 504]);
const fallbackModels = ["gemini-2.0-flash", "gemini-1.5-flash-latest", "gemini-1.5-flash"];

function availableKeys() {
  return [
    Deno.env.get("GEMINI_API_KEY_1"),
    Deno.env.get("GEMINI_API_KEY_2"),
    Deno.env.get("GEMINI_API_KEY_3"),
    Deno.env.get("GEMINI_API_KEY_4"),
    Deno.env.get("GEMINI_API_KEY_5"),
    Deno.env.get("GEMINI_API_KEY"), // safe migration fallback
  ].filter((key): key is string => Boolean(key));
}

/** Sends a Gemini request with round-robin key selection and automatic model fallback. */
export async function geminiFetch(url: string, init: RequestInit): Promise<Response> {
  const keys = availableKeys();
  if (!keys.length) throw new Error("No Gemini API key is configured in Supabase environment.");
  
  const modelMatch = url.match(/\/models\/([^:]+):/);
  const requestedModel = modelMatch ? modelMatch[1] : "gemini-2.0-flash";
  const modelsToTry = Array.from(new Set([requestedModel, ...fallbackModels]));

  let lastResponse: Response | undefined;

  for (const model of modelsToTry) {
    const currentUrl = url.replace(/\/models\/[^:]+:/, `/models/${model}:`);
    const start = Math.floor(Date.now() / 1000) % keys.length;

    for (let attempt = 0; attempt < keys.length; attempt++) {
      const index = (start + attempt) % keys.length;
      const headers = new Headers(init.headers);
      headers.set("x-goog-api-key", keys[index]);
      lastResponse = await fetch(currentUrl, { ...init, headers });

      if (lastResponse.ok || (!retryableStatuses.has(lastResponse.status) && lastResponse.status !== 404)) {
        return lastResponse;
      }
      if (retryableStatuses.has(lastResponse.status)) {
        console.warn(`Gemini response ${lastResponse.status} for model ${model}; retrying key slot ${index + 1}.`);
      }
    }

    if (lastResponse && lastResponse.status === 404) {
      console.warn(`Gemini model '${model}' returned 404; trying fallback model...`);
    }
  }

  return lastResponse!;
}
