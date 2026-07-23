const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const url = envLocal.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
// Use the Anon key, RLS will apply, but RPC should execute and return any syntax error.
const key = envLocal.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();

const supabase = createClient(url, key);

(async () => {
  const dummyEmbedding = Array(768).fill(0);
  const { data, error } = await supabase.rpc('hybrid_search_chunks', {
    query_text: "test",
    query_embedding: dummyEmbedding,
    p_institution_id: "00000000-0000-0000-0000-000000000001",
    match_count: 5,
    metadata_filter: { department: "Computer Science" }
  });
  console.log("Data:", data);
  console.log("Error:", error);
})();
