import fs from "fs";

console.log("ENV SUPABASE_ACCESS_TOKEN:", process.env.SUPABASE_ACCESS_TOKEN);

try {
  const envFile = fs.readFileSync(".env.local", "utf8");
  console.log(".env.local contents:");
  console.log(envFile);
} catch (e) {
  console.log("Error reading .env.local:", e);
}
