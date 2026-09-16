const fs = require('fs');

async function testAnalyze() {
  const envLocal = fs.readFileSync('.env.local', 'utf8');
  const url = envLocal.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
  const anonKey = envLocal.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();

  console.log("Calling analyze-timetable...");

  const res = await fetch(`${url}/functions/v1/analyze-timetable`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${anonKey}`,
      "apikey": anonKey
    },
    body: JSON.stringify({
      resourceId: "00000000-0000-0000-0000-000000000000",
      semesterStart: "2026-09-07",
      semesterEnd: "2026-12-07"
    })
  });

  console.log("Response Status:", res.status);
  console.log("Response Headers:", Object.fromEntries(res.headers.entries()));
  const text = await res.text();
  console.log("Response Text:", text);
}

testAnalyze();
