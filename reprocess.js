const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function reprocess() {
  const { data: docs, error } = await supabase
    .from('documents')
    .select('*')
    .eq('metadata->>processing_status', 'failed');
  
  if (error) {
    console.error("DB error:", error);
    return;
  }
  
  console.log(`Found ${docs.length} failed documents.`);
  
  for (const doc of docs) {
    console.log(`Reprocessing ${doc.title}...`);
    // update status to processing
    await supabase.from('documents').update({ metadata: { ...doc.metadata, processing_status: 'processing' } }).eq('id', doc.id);
    
    // trigger edge function
    const { data, error: fnError } = await supabase.functions.invoke('process-document', {
      body: {
        documentId: doc.id,
        storagePath: doc.storage_path,
        extension: doc.file_type
      }
    });
    
    if (fnError) {
       console.error(`Failed to process ${doc.title}:`, fnError);
       await supabase.from('documents').update({ metadata: { ...doc.metadata, processing_status: 'failed', error: fnError.message } }).eq('id', doc.id);
    } else {
       console.log(`Successfully processed ${doc.title}:`, data);
       await supabase.from('documents').update({ metadata: { ...doc.metadata, processing_status: 'ready', error: null }, chunk_count: data?.chunks || 0 }).eq('id', doc.id);
    }
  }
}
reprocess();
