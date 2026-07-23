const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const envLocal = fs.readFileSync('.env.local', 'utf8');
const url = envLocal.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const key = envLocal.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1]?.trim() || envLocal.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();

const supabase = createClient(url, key);
(async () => {
  const { data, error } = await supabase.from('personal_resources').select('*').eq('resource_type', 'timetable');
  console.log(JSON.stringify(data, null, 2));
})();
