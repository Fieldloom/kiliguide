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

async function testDepts() {
  const { data: depts, error } = await supabase.from("departments").select("*");
  console.log("Departments in DB:", depts, "Error:", error);
}

testDepts();
