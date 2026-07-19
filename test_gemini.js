import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Load from .env.local
const SUPABASE_URL = "https://jxspwvfxugckztzuogot.supabase.co";
// I don't have the service role key. I will just fetch without it if the bucket is public?
// The personal-resources bucket is private. I can't download the file without the auth token.
