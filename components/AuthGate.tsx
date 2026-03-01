"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function AuthGate(props: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setAuthed(!!session);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signIn() {
    if (!email) return;
    await supabase.auth.signInWithOtp({ email });
    alert("Check your email for the magic link.");
  }

  if (!ready) return <div className="p-6 text-muted">Loading…</div>;

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl bg-panel/80 border border-white/5 p-6">
          <div className="text-xl font-semibold">Leverage</div>
          <div className="text-sm text-muted mt-1">Sign in (owner only for now).</div>
          <div className="mt-4 space-y-3">
            <input
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 outline-none"
              placeholder="you@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <button
              className="w-full rounded-xl bg-money text-black font-semibold py-2"
              onClick={signIn}
              type="button"
            >
              Send magic link
            </button>
          </div>
          <div className="text-xs text-muted mt-4">
            Later we’ll add roles + tech logins. For now it’s single-user.
          </div>
        </div>
      </div>
    );
  }

  return <>{props.children}</>;
}
