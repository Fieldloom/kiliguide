const fs = require('fs');

async function testAllModels() {
  const envLocal = fs.readFileSync('.env.local', 'utf8');
  const key1 = envLocal.match(/GEMINI_API_KEY_1=(.*)/)?.[1]?.trim() || process.env.GEMINI_API_KEY_1;
  const keyMain = process.env.GEMINI_API_KEY || key1;

  console.log("Key available:", Boolean(keyMain));

  const models = [
    "gemini-1.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-pro",
    "gemini-2.0-flash-lite"
  ];

  for (const m of models) {
    // 1. Test with ?key= parameter
    const urlWithKey = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${keyMain}`;
    const res1 = await fetch(urlWithKey, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: "Hello" }] }] })
    });
    const status1 = res1.status;
    const json1 = await res1.json().catch(() => ({}));
    console.log(`Model [${m}] WITH ?key= => status ${status1}:`, json1.error?.message || "SUCCESS!");

    // 2. Test WITHOUT ?key= parameter (only header)
    const urlNoKey = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`;
    const res2 = await fetch(urlNoKey, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": keyMain },
      body: JSON.stringify({ contents: [{ parts: [{ text: "Hello" }] }] })
    });
    const status2 = res2.status;
    const json2 = await res2.json().catch(() => ({}));
    console.log(`Model [${m}] WITHOUT ?key= (header only) => status ${status2}:`, json2.error?.message || "SUCCESS!");
  }
}

testAllModels();
