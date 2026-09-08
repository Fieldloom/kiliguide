import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://jxspwvfxugckztzuogot.supabase.co', process.env.SUPABASE_ANON_KEY || 'dummy');

async function test() {
  const res = await fetch('https://jxspwvfxugckztzuogot.supabase.co/functions/v1/crawl-sitemap', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({ mode: 'discover', max: 5 })
  });
  console.log('Status:', res.status);
  const data = await res.text();
  console.log('Data:', data);
}
test();
