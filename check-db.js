const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
  const { data: documents, error } = await supabase
    .from('documents')
    .select('id, title, file_type, processing_status, processing_error, chunk_count')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error("Error fetching:", error);
    return;
  }

  console.log("LATEST DOCUMENT:");
  console.log(JSON.stringify(documents[0], null, 2));
}

check();
