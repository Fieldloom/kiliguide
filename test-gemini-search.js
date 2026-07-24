const fs = require('fs');

async function testGeminiSearch() {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  let key = '';
  envContent.split('\n').forEach(line => {
    if (line.startsWith('GEMINI_API_KEY=')) {
      key = line.split('=')[1].trim();
    }
  });

  if (!key) {
    console.error("No Gemini API key found");
    return;
  }

  const payload = {
    contents: [{ role: "user", parts: [{ text: "Who won the super bowl in 2024? Search the web." }] }],
    tools: [{ googleSearch: {} }],
    generationConfig: { temperature: 0 }
  };

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}

testGeminiSearch();
