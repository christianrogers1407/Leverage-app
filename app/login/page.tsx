"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    router.push("/");
  }

  async function handleMagicLink() {
    setMessage("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: "http://localhost:3000/login",
      },
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Magic link sent.");
  }

  async function handleSetPassword() {
    const { error } = await supabase.auth.updateUser({
      password: "test1234",
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Password set to test1234");
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Login</h1>

      <form onSubmit={handlePasswordLogin} className="space-y-3">
        <input
          className="w-full rounded border p-3"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full rounded border p-3"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="w-full rounded bg-black text-white p-3">
          Sign in with password
        </button>
      </form>

      <button
        className="w-full rounded border p-3"
        onClick={handleMagicLink}
      >
        Send magic link
      </button>

      <button
        className="w-full rounded border p-3"
        onClick={handleSetPassword}
      >
        Set Password (temp)
      </button>

      {message ? <div className="text-sm">{message}</div> : null}
    </div>
  );
}