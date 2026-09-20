const fs = require('fs');

if (fs.existsSync('.env.local')) {
  const content = fs.readFileSync('.env.local', 'utf8');
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      process.env[key] = value;
    }
  });
}

const keys = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
  process.env.GEMINI_API_KEY_4,
  process.env.GEMINI_API_KEY_5,
  process.env.GEMINI_API_KEY,
].filter(Boolean);

console.log("Found Gemini API keys count:", keys.length);

async function testEmbedding() {
  const modelsToTest = [
    { ver: "v1beta", mod: "text-embedding-004" },
    { ver: "v1", mod: "text-embedding-004" },
    { ver: "v1beta", mod: "embedding-001" },
    { ver: "v1", mod: "embedding-001" },
  ];

  for (const { ver, mod } of modelsToTest) {
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i].trim();
      const url = `https://generativelanguage.googleapis.com/${ver}/models/${mod}:embedContent?key=${encodeURIComponent(key)}`;
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: { parts: [{ text: "Hello world test document" }] },
            output_dimensionality: 768
          })
        });
        const data = await res.json();
        console.log(`[${ver} - ${mod} - key ${i+1}] status: ${res.status}`, res.ok ? "SUCCESS length:" + (data.embedding?.values?.length || data.embeddings?.[0]?.values?.length) : data);
      } catch (err) {
        console.error(`[${ver} - ${mod} - key ${i+1}] err:`, err.message);
      }
    }
  }
}

testEmbedding();
