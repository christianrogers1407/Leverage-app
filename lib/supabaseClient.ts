import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://nqzoizfekbrqxsvkpkgr.supabase.co",
  "sb_publishable_RLUk0zYKIX9PJFSRaS-vVA_H0-8vJHj",
  {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  }
);
