import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://nqzoizfekbrqxsvkpkgr.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xem9pemZla2JycXhzdmtwa2dyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzMDYzMDgsImV4cCI6MjA4Nzg4MjMwOH0.xGi57urnqcqc5syLgzpWpgC5MglWIhrCttWF8CBTY-Y",
  {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  }
);
