const nvidiaKey = "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";

async function testNvidiaVision() {
  console.log("Testing NVIDIA Vision API...");
  const start = Date.now();
  
  // Create a tiny 1x1 pixel base64 PNG for testing the image payload
  const dummyBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
  
  try {
    const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${nvidiaKey}`
      },
      body: JSON.stringify({
        model: "meta/llama-3.2-11b-vision-instruct",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Describe this image in JSON format: {'description': '...'}" },
              { type: "image_url", image_url: { url: `data:image/png;base64,${dummyBase64}` } }
            ]
          }
        ],
        temperature: 0,
        max_tokens: 100
      })
    });

    if (!res.ok) {
      console.error("NVIDIA API Error:", res.status, await res.text());
      return;
    }

    const data = await res.json();
    console.log(`Success! Took ${Date.now() - start}ms`);
    console.log("Response:", data.choices[0].message.content);
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

testNvidiaVision();
