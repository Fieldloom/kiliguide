console.log("Environment keys containing SUPABASE or TOKEN or KEY:");
Object.keys(process.env).forEach(k => {
  if (k.toUpperCase().includes("SUPABASE") || k.toUpperCase().includes("TOKEN")) {
    console.log(`${k}: ${process.env[k] ? process.env[k].substring(0, 10) + "..." : "empty"}`);
  }
});
