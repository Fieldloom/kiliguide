import { encodeBase64 } from "jsr:@std/encoding/base64";

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

/** 
 * High-performance Gemini File API wrapper for PDF and document processing.
 * Uploads files via Gemini Files API first to eliminate 30-second Base64 socket timeouts.
 */
export async function geminiAnalyzeDocument(
  buffer: ArrayBuffer,
  mimeType: string,
  promptText: string
): Promise<Response> {
  const keys = availableKeys();
  if (!keys.length) throw new Error("No Gemini API key is configured in Supabase environment.");

  const start = Math.floor(Date.now() / 1000) % keys.length;

  for (const model of modelsToTry) {
    for (let attempt = 0; attempt < keys.length; attempt++) {
      const index = (start + attempt) % keys.length;
      const key = keys[index].trim();

      try {
        let parts: any[] = [];

        // Stream larger files or PDFs to Gemini Files API to eliminate Base64 size overhead & socket timeouts
        if (buffer.byteLength > 512 * 1024 || mimeType === "application/pdf") {
          const uploadUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${encodeURIComponent(key)}`;
          const uploadRes = await fetch(uploadUrl, {
            method: "POST",
            headers: {
              "X-Goog-Upload-Protocol": "raw",
              "Content-Type": mimeType
            },
            body: buffer
          });

          if (uploadRes.ok) {
            const uploadJson = await uploadRes.json();
            const fileUri = uploadJson.file?.uri;
            if (fileUri) {
              parts = [
                { fileData: { mimeType, fileUri } },
                { text: promptText }
              ];
            }
          } else {
            const uploadErr = await uploadRes.text();
            console.warn(`Gemini File Upload API failed status ${uploadRes.status}: ${uploadErr}. Falling back to inline Base64...`);
          }
        }

        // Fallback to inline base64 if file upload was skipped or returned no URI
        if (!parts.length) {
          const base64Data = encodeBase64(new Uint8Array(buffer));
          parts = [
            { inlineData: { mimeType, data: base64Data } },
            { text: promptText }
          ];
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: "application/json"
            }
          })
        });

        if (res.ok) {
          return res;
        }

        const errBody = await res.clone().text();
        console.error(`geminiAnalyzeDocument failed [model: ${model}, slot: ${index + 1}, status: ${res.status}]: ${errBody}`);
      } catch (e: any) {
        console.error(`geminiAnalyzeDocument error [model: ${model}, slot: ${index + 1}]: ${e?.message || e}`);
      }
    }
  }

  throw new Error("Failed to process document with Gemini AI after trying all available models and API keys.");
}
