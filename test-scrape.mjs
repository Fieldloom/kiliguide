import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://jxspwvfxugckztzuogot.supabase.co', process.env.SUPABASE_ANON_KEY || 'dummy');

async function test() {
  const { data, error } = await supabase.functions.invoke('scrape-dekut', {
    body: { url: 'https://www.dkut.ac.ke/index.php/about-dekut/administrative-units/directorate-of-ict' }
  });
  console.log('Data:', data);
  if (error) {
    console.error('Error:', error.message);
    try {
      console.log('Error context:', await error.context.json());
    } catch (e) {
      console.log('No extra context');
    }
  }
}
test();
