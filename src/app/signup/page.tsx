"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, age, gender, username, password, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Signup failed. Try again.");
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

      <div className="glass-panel auth-panel p-6 md:p-8 rounded-2xl relative overflow-hidden max-h-[90vh]">
        <div className="panel-border-shine" />

        <div className="mb-6 select-none text-center">
          <h1 className="title-glow text-2xl font-extrabold uppercase tracking-[0.2em] text-[#f4b740] font-sans">
            Sign Up
          </h1>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400 mt-2 font-mono">
            Join the Adventure
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="auth-field">
            <label className="auth-label" htmlFor="name">Name</label>
            <input
              id="name"
              className="auth-input"
              type="text"
              autoComplete="name"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              maxLength={50}
            />
          </div>

          <div className="auth-row">
            <div className="auth-field">
              <label className="auth-label" htmlFor="age">Age</label>
              <input
                id="age"
                className="auth-input"
                type="number"
                placeholder="18"
                min={5}
                max={120}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="gender">Gender</label>
              <select
                id="gender"
                className="auth-input"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                required
              >
                <option value="" disabled>Select…</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

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
              minLength={3}
              maxLength={20}
              pattern="[A-Za-z0-9_]+"
              title="Letters, numbers, and underscores only"
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="password">Password</label>
            <input
              id="password"
              className="auth-input"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              className="auth-input"
              type="password"
              autoComplete="new-password"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button
            type="submit"
            disabled={busy}
            className="btn-primary py-3 px-6 text-sm uppercase tracking-widest font-bold font-mono mt-2"
          >
            {busy ? "Creating account…" : "Sign Up"}
          </button>
        </form>

        <p className="text-xs text-gray-400 mt-6 text-center font-mono">
          Already have an account?{" "}
          <Link href="/login" className="auth-link">Login</Link>
        </p>
      </div>
    </main>
  );
}
