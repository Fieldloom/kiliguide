import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// This is intentionally nullable: the product remains easy to preview before
// a university Supabase project has been provisioned.
export const supabase = url && key 
  ? createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'kiliguide-auth-token'
      }
    }) 
  : null;

export const isSupabaseConfigured = Boolean(supabase);
