"use client";

import React from "react";
import Link from "next/link";

/**
 * Public marketing page shown at "/" to logged-out visitors. Login/signup is
 * mandatory to *play* (the game HTML files stay gated in proxy.ts), but this page
 * is intentionally public and content-rich: it gives search engines a real, crawlable
 * page and doubles as the signup front door. The game menu with
 * Play buttons only renders once the visitor is authenticated (see app/page.tsx).
 */

const MODES: { icon: string; name: string; tag: string; desc: string }[] = [
  {
    icon: "🌍",
    name: "Explore",
    tag: "Open World",
    desc: "Drive cars, fly helicopters, ride the city train, and pilot rockets across a curved tiny planet — from a bustling downtown to the village, the docks, and a working rocket launch pad. Earn gold, take on deliveries and demolition contracts, and blast off to the Moon and Mars.",
  },
  {
    icon: "🎯",
    name: "Team Deathmatch",
    tag: "4 v 4 · Live",
    desc: "Real players, real voice chat. Drop into a 4v4 arena and race to 25 eliminations. No bots — every opponent is another human online right now.",
  },
  {
    icon: "🪂",
    name: "Battle Royale",
    tag: "Live Drop",
    desc: "Parachute in, loot up, and be the last one standing. Squad up with friends over voice, or go solo. Live players only — invite your crew and drop together.",
  },
  {
    icon: "💥",
    name: "Destruction",
    tag: "Co-op Sandbox",
    desc: "Smash the same city with real players in a shared physics sandbox. Level buildings, flip cars, and cause glorious chaos — together.",
  },
  {
    icon: "🚀",
    name: "Rocket Mission",
    tag: "Learn & Operate",
    desc: "Stack the booster, load propellant, run the flight director's countdown, reach orbit, refuel, and land on the Moon and Mars. A hands-on rocketry mission you actually operate step by step.",
  },
];

const FEATURES: { icon: string; text: string }[] = [
  { icon: "🎮", text: "Five game modes in one browser — no install, no download." },
  { icon: "🌐", text: "Real-time multiplayer with live voice chat." },
  { icon: "🪙", text: "Earn gold, unlock capes, vehicles, spacecraft and gear." },
  { icon: "🛰️", text: "Fly from a tiny city all the way to the Moon and Mars." },
  { icon: "📺", text: "Advertise your brand on real in-game city billboards." },
  { icon: "💸", text: "Free to play — sign up in seconds and jump straight in." },
];

export default function PublicLanding() {
  return (
    <div style={{ position: "relative", width: "100%", minHeight: "100vh", overflowX: "hidden" }}>
      {/* Background */}
      <div className="absolute inset-0 -z-10" style={{ background: "linear-gradient(160deg,#14161d 0%,#1b1d27 45%,#12202b 100%)" }} />
      <div className="absolute inset-0 -z-10" style={{ background: "radial-gradient(circle at 50% 12%, rgba(244,183,64,0.12) 0%, transparent 55%)" }} />

      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "0 20px" }}>
        {/* Hero */}
        <header style={{ textAlign: "center", paddingTop: 96, paddingBottom: 40 }}>
          <div style={{ fontSize: 11, letterSpacing: 4, textTransform: "uppercase", color: "#8a8f96", fontFamily: "'Space Mono', monospace", marginBottom: 14 }}>
            Open-World City &amp; Space Sandbox
          </div>
          <h1 className="title-glow" style={{ fontSize: "clamp(40px,9vw,76px)", fontWeight: 800, letterSpacing: 4, textTransform: "uppercase", color: "#f4b740", lineHeight: 1.02, margin: 0, fontFamily: "var(--font-sans, sans-serif)" }}>
            Arcade 3D
          </h1>
          <p style={{ maxWidth: 620, margin: "22px auto 0", color: "#c4ccd6", fontSize: "clamp(15px,2.4vw,19px)", lineHeight: 1.6 }}>
            Drive, fly, battle, and launch rockets across a whole miniature world — from
            city streets to the surface of Mars. Five modes, real multiplayer, live voice,
            all in your browser.
          </p>

          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginTop: 34 }}>
            <Link href="/signup" className="btn-primary" style={{ padding: "15px 34px", fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: 2, textDecoration: "none", fontFamily: "'Space Mono', monospace" }}>
              ▶ Sign up free to play
            </Link>
            <Link href="/login" className="btn-secondary" style={{ padding: "15px 30px", fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, textDecoration: "none", fontFamily: "'Space Mono', monospace" }}>
              Log in
            </Link>
          </div>
          <p style={{ color: "#6c727b", fontSize: 12, marginTop: 16, fontFamily: "'Space Mono', monospace" }}>
            Free account · Login required to play · No download
          </p>
        </header>

        {/* Game modes */}
        <section style={{ paddingBottom: 20 }}>
          <h2 style={{ textAlign: "center", fontSize: 13, letterSpacing: 3, textTransform: "uppercase", color: "#8a8f96", fontFamily: "'Space Mono', monospace", marginBottom: 26 }}>
            Five games in one
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
            {MODES.map((m) => (
              <article key={m.name} className="glass-panel" style={{ padding: "22px 22px 24px", borderRadius: 16, textAlign: "left" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <span style={{ fontSize: 30, lineHeight: 1 }} aria-hidden>{m.icon}</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#eef2f7" }}>{m.name}</h3>
                    <span style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: "#f4b740", fontFamily: "'Space Mono', monospace" }}>{m.tag}</span>
                  </div>
                </div>
                <p style={{ margin: 0, color: "#aab3bf", fontSize: 13.5, lineHeight: 1.65 }}>{m.desc}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Features */}
        <section style={{ padding: "44px 0 12px" }}>
          <h2 style={{ textAlign: "center", fontSize: 13, letterSpacing: 3, textTransform: "uppercase", color: "#8a8f96", fontFamily: "'Space Mono', monospace", marginBottom: 24 }}>
            Why players love it
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14, maxWidth: 860, margin: "0 auto" }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "14px 16px" }}>
                <span style={{ fontSize: 20, lineHeight: 1.2 }} aria-hidden>{f.icon}</span>
                <span style={{ color: "#c4ccd6", fontSize: 14, lineHeight: 1.55 }}>{f.text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section style={{ textAlign: "center", padding: "48px 0 20px" }}>
          <h2 style={{ fontSize: "clamp(24px,4vw,34px)", fontWeight: 800, color: "#eef2f7", margin: "0 0 10px" }}>
            Ready to explore your tiny planet?
          </h2>
          <p style={{ color: "#aab3bf", fontSize: 15, marginBottom: 26 }}>
            Create a free account and you&apos;re playing in seconds.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/signup" className="btn-primary" style={{ padding: "15px 34px", fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: 2, textDecoration: "none", fontFamily: "'Space Mono', monospace" }}>
              Sign up free
            </Link>
            <Link href="/login" className="btn-secondary" style={{ padding: "15px 30px", fontSize: 14, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, textDecoration: "none", fontFamily: "'Space Mono', monospace" }}>
              Log in
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: 40, padding: "26px 0 40px", textAlign: "center", fontFamily: "'Space Mono', monospace" }}>
          <div style={{ display: "flex", gap: 18, justifyContent: "center", flexWrap: "wrap", fontSize: 12.5, marginBottom: 14 }}>
            <Link href="/login" className="auth-link">Login</Link>
            <Link href="/signup" className="auth-link">Sign up</Link>
            <Link href="/contact" className="auth-link">Contact</Link>
            <Link href="/ads" className="auth-link">Advertise ($4.99/day)</Link>
          </div>
          <p style={{ color: "#5f656e", fontSize: 11 }}>Arcade 3D · Open source under the MIT license · Play free in your browser</p>
        </footer>
      </div>
    </div>
  );
}
