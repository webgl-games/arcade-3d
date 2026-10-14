"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const d = await res.json();
      if (!res.ok) { setErr(d.error || "Could not send."); return; }
      setSent(true);
    } catch {
      setErr("Could not reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="landing-overlay flex items-center justify-center p-4" style={{ overflowY: "auto" }}>
      <div className="auth-backdrop -z-10 animate-pulse-slow" />
      <div className="glass-panel auth-panel p-6 rounded-2xl relative overflow-hidden">
        <div className="panel-border-shine" />
        <div className="mb-5 select-none text-center">
          <h1 className="title-glow text-2xl font-extrabold uppercase tracking-[0.2em] text-[#f4b740] font-sans">Contact Us</h1>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400 mt-2 font-mono">Arcade 3D &bull; we read every message</p>
        </div>

        {sent ? (
          <div className="text-center font-mono">
            <div className="auth-error" style={{ borderColor: "rgba(46,204,113,.4)", background: "rgba(46,204,113,.1)", color: "#b9f0cf" }}>
              ✅ Thanks! Your message was sent — we&apos;ll get back to you soon.
            </div>
            <p className="text-xs text-gray-400 mt-5"><Link href="/" className="auth-link">← Back to the game</Link></p>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4 font-mono">
            <div className="auth-field">
              <label className="auth-label" htmlFor="c-name">Name</label>
              <input id="c-name" className="auth-input" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} placeholder="Your name" />
            </div>
            <div className="auth-field">
              <label className="auth-label" htmlFor="c-email">Email</label>
              <input id="c-email" type="email" className="auth-input" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
            </div>
            <div className="auth-field">
              <label className="auth-label" htmlFor="c-subject">Subject</label>
              <input id="c-subject" className="auth-input" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="What's this about?" />
            </div>
            <div className="auth-field">
              <label className="auth-label" htmlFor="c-msg">Message</label>
              <textarea id="c-msg" className="auth-input" style={{ minHeight: 120, resize: "vertical" }} value={message} onChange={(e) => setMessage(e.target.value)} required minLength={5} placeholder="How can we help?" />
            </div>
            {err && <div className="auth-error">{err}</div>}
            <button type="submit" disabled={busy} className="btn-primary py-3 px-6 text-sm uppercase tracking-widest font-bold">
              {busy ? "Sending…" : "Send Message"}
            </button>
            <p className="text-xs text-gray-500 text-center"><Link href="/" className="auth-link">← Back to the game</Link></p>
          </form>
        )}
      </div>
    </main>
  );
}
