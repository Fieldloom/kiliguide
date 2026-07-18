const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function debug() {
  const { data: documents, error } = await supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error("Failed to fetch documents:", error);
    return;
  }

  if (!documents || documents.length === 0) {
    console.error("No documents found in DB!");
    return;
  }

  const doc = documents[0];
  console.log("Found latest document:", doc.id, doc.title, doc.storage_path);

  // Now let's trigger the edge function to see the EXACT error!
  console.log("Triggering process-document...");
  
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/process-document`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      documentId: doc.id,
      storagePath: doc.storage_path,
      extension: doc.file_type || "pdf"
    })
  });

  const bodyText = await res.text();
  console.log("Status code:", res.status);
  console.log("Response body:", bodyText);
}

debug();
