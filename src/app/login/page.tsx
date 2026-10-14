"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login failed. Try again.");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="landing-overlay flex items-center justify-center p-4">
      <div className="auth-backdrop -z-10 animate-pulse-slow" />

      <div className="glass-panel auth-panel p-6 md:p-8 rounded-2xl relative overflow-hidden">
        <div className="panel-border-shine" />

        <div className="mb-6 select-none text-center">
          <h1 className="title-glow text-2xl font-extrabold uppercase tracking-[0.2em] text-[#f4b740] font-sans">
            Login
          </h1>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400 mt-2 font-mono">
            Arcade 3D &bull; Open World
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="auth-field">
            <label className="auth-label" htmlFor="username">Username</label>
            <input
              id="username"
              className="auth-input"
              type="text"
              autoComplete="username"
              placeholder="your_username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="password">Password</label>
            <input
              id="password"
              className="auth-input"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button
            type="submit"
            disabled={busy}
            className="btn-primary py-3 px-6 text-sm uppercase tracking-widest font-bold font-mono mt-2"
          >
            {busy ? "Logging in…" : "Login"}
          </button>
        </form>

        <p className="text-xs text-gray-400 mt-6 text-center font-mono">
          No account yet?{" "}
          <Link href="/signup" className="auth-link">Sign up</Link>
        </p>
      </div>
    </main>
  );
}
