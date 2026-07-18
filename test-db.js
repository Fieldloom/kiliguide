const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const url = envLocal.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const key = envLocal.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();

const supabase = createClient(url, key);

(async () => {
  const { data, error } = await supabase.from('documents').select('id, title, category, file_type, status, processing_status, processing_error').order('created_at', { ascending: false }).limit(5);
  console.log(JSON.stringify(data, null, 2));
})();
