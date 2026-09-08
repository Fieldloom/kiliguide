// Test NVIDIA Vision API with a small test image
const nvidiaKey = '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';

// Create a tiny 1x1 white PNG for testing
const tinyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');
const base64Data = tinyPng.toString('base64');

async function test() {
  console.log("Testing NVIDIA Vision API with system prompt...");
  
  const payload = {
    model: "meta/llama-3.2-11b-vision-instruct",
    messages: [
      {
        role: "system",
        content: "You are a JSON-only data extraction system. You MUST respond with ONLY a valid JSON object."
      },
      {
        role: "user",
        content: [
          { type: "text", text: 'Return a JSON object describing this image: {"description": "..."}' },
          { type: "image_url", image_url: { url: `data:image/png;base64,${base64Data}` } }
        ]
      }
    ],
    temperature: 0,
    max_tokens: 500
  };

  try {
    const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        "Authorization": `Bearer ${nvidiaKey}` 
      },
      body: JSON.stringify(payload)
    });

    console.log("Status:", res.status);
    const data = await res.text();
    console.log("Response:", data);
  } catch (e) {
    console.error("Error:", e.message);
  }
}

test();
