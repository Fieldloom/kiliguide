import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL="?([^"\n]+)"?/)?.[1];
const key = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY="?([^"\n]+)"?/)?.[1];

if (!url || !key) throw new Error("Key not found");

const supabase = createClient(url, key);

async function test() {
  console.log("Signing in...");
  const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@dkut.ac.ke',
    password: 'password123'
  });
  if (authError) {
    console.log("Auth error", authError);
    return;
  }
  
  console.log("Calling normal...");
  const res1 = await supabase.functions.invoke('chat', {
    body: { question: "Helb latest news from their website", conversationId: "test-conv" }
  });
  console.log("Res1:", res1.data, res1.error);
  
  console.log("Calling forceWebSearch...");
  const res2 = await supabase.functions.invoke('chat', {
    body: { question: "Helb latest news from their website", conversationId: "test-conv", forceWebSearch: true }
  });
  console.log("Res2:", res2.data, res2.error);
}

test();
