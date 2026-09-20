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

async function testDb() {
  console.log("Checking institutions...");
  const { data: insts, error: instErr } = await supabase.from("institutions").select("*");
  console.log("Institutions:", insts, "Error:", instErr);

  console.log("Checking system_settings...");
  const { data: settings, error: setErr } = await supabase.from("system_settings").select("*");
  console.log("System settings:", settings, "Error:", setErr);
}

testDb();
