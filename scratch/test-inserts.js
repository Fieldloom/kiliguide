import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const envFile = fs.readFileSync(".env.local", "utf8");
const envVars = {};
envFile.split("\n").forEach(line => {
  const [k, v] = line.split("=");
  if (k && v) envVars[k.trim()] = v.trim();
});

const url = envVars["NEXT_PUBLIC_SUPABASE_URL"];
const key = envVars["NEXT_PUBLIC_SUPABASE_ANON_KEY"];

const supabase = createClient(url, key);

async function testInserts() {
  const fakeId = "11111111-2222-3333-4444-555555555555";

  console.log("1. Testing insertion into profiles...");
  const { error: profErr } = await supabase.from("profiles").insert({
    id: fakeId,
    full_name: "Test User",
    preferred_language: "en",
    institution_id: "00000000-0000-0000-0000-000000000001"
  });
  console.log("Profile insert result:", profErr);

  console.log("2. Testing insertion into user_roles...");
  const { error: roleErr } = await supabase.from("user_roles").insert({
    user_id: fakeId,
    role: "student"
  });
  console.log("User role insert result:", roleErr);

  console.log("3. Testing insertion into notification_preferences...");
  const { error: prefErr } = await supabase.from("notification_preferences").insert({
    user_id: fakeId
  });
  console.log("Notification pref insert result:", prefErr);

  // Clean up
  await supabase.from("notification_preferences").delete().eq("user_id", fakeId);
  await supabase.from("user_roles").delete().eq("user_id", fakeId);
  await supabase.from("profiles").delete().eq("id", fakeId);
}

testInserts();
