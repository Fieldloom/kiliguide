const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testProcess() {
  const { data: docs } = await supabase.from('documents').select('id, storage_path, file_type').order('created_at', { ascending: false }).limit(1);
  if (!docs || docs.length === 0) {
    console.log("No documents found");
    return;
  }
  const doc = docs[0];
  console.log("Invoking process-document for:", doc);

  const { data, error } = await supabase.functions.invoke("process-document", {
    body: { documentId: doc.id, storagePath: doc.storage_path, extension: doc.file_type }
  });
  
  if (error) {
    console.error("Invoke Error:", error);
  } else {
    console.log("Success:", data);
  }
}

testProcess();
