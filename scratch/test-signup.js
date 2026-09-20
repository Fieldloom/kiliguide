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

async function testMinimalSignUp() {
  const randomId = Math.floor(Math.random() * 1000000);
  const email = `minimal_${randomId}@gmail.com`;
  console.log("Testing minimal signup with email:", email);
  try {
    const result = await supabase.auth.signUp({
      email,
      password: "password12345!",
    });

    console.log("Result object:", JSON.stringify(result, null, 2));
  } catch (err) {
    console.log("Caught exception:", err);
  }
}

testMinimalSignUp();
