    async function fallbackOcr(buf: Buffer, mime: string) {
      const keys = [Deno.env.get("GEMINI_API_KEY_1"), Deno.env.get("GEMINI_API_KEY_2")].filter(Boolean);
      const apiKey = keys[0];
      if (!apiKey) throw new Error("GEMINI_API_KEY_1 is not configured.");
      
      // Upload file to Gemini
      const uploadRes = await fetch(`https://generativelanguage.googleapis.com/upload/v1beta/files?uploadType=media&key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": mime },
        body: buf
      });
      if (!uploadRes.ok) throw new Error(`Gemini File Upload failed: ${await uploadRes.text()}`);
      const uploadData = await uploadRes.json();
      const fileUri = uploadData.file.uri;

      // Generate content
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [
              { text: "Extract all text from this document accurately. Preserve structure, tables, and lists. Do not add any extra commentary." },
              { fileData: { mimeType: mime, fileUri: fileUri } }
            ]
          }],
          generationConfig: { temperature: 0 }
        })
      });
      if (!response.ok) throw new Error(`Gemini OCR failed: ${await response.text()}`);
      const res = await response.json();
      
      // Delete file to save space
      await fetch(`https://generativelanguage.googleapis.com/v1beta/files/${uploadData.file.name.replace('files/', '')}?key=${apiKey}`, { method: "DELETE" });

      return res.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }
