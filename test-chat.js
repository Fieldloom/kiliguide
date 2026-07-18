const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testChat() {
  console.log("Asking KiliGuide about hostels...");
  const { data, error } = await supabase.functions.invoke("chat", {
    body: { question: "What external hostels are available?" }
  });
  
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Answer:", data.answer);
    console.log("Sources:", data.sources);
  }
}

testChat();
