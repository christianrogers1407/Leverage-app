"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);

  const isPublicPath =
  pathname === "/login" ||
  pathname === "/test123" ||
  pathname === "/routesheet" ||
  pathname.startsWith("/cars"); 

  useEffect(() => {
    async function checkAuth() {
      const { data } = await supabase.auth.getSession();
      setAuthed(!!data.session);
      setLoading(false);
    }

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isPublicPath) {
  return <>{children}</>;
}

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!authed) {
    return (
      <div className="max-w-md mx-auto p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Magic Link Login</h1>
        <p className="text-sm text-gray-500">
          You are not signed in yet.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
