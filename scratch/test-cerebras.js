const cerebrasKey = process.env.CEREBRAS_API_KEY;

if (!cerebrasKey) {
  console.error("No CEREBRAS_API_KEY found in .env.local!");
  process.exit(1);
}

async function testCerebras() {
  console.log("Testing Cerebras API...");
  const start = Date.now();
  
  try {
    const res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${cerebrasKey}`
      },
      body: JSON.stringify({
        model: "gpt-oss-120b",
        messages: [
          { role: "system", content: "You are a helpful assistant. Output JSON." },
          { role: "user", content: "Give me a test JSON response with {'status': 'success'}." }
        ],
        response_format: { type: "json_object" },
        temperature: 0
      })
    });

    if (!res.ok) {
      console.error("Cerebras API Error:", await res.text());
      return;
    }

    const data = await res.json();
    console.log(`Success! Took ${Date.now() - start}ms`);
    console.log("Response:", data.choices[0].message.content);
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

testCerebras();
