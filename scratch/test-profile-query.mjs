import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data, error } = await supabase
    .from("profiles")
    .select("custom_instructions, institution_id, departments(name)")
    .limit(1)
    .single();

  console.log("Data:", data);
  console.log("Error:", error);
}
test();
