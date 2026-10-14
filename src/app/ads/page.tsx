"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

interface BoardInfo { id: string; name: string }
type Availability = Record<string, Record<string, boolean>>;
interface MyBooking {
  id: string; boardId: string; boardName: string; date: string;
  phase: "unpaid" | "live" | "scheduled" | "completed";
  media: { fileId: string; type: string }[];
  linkUrl: string | null; views: number; clicks: number;
}
const PHASE_STYLE: Record<string, { label: string; color: string }> = {
  live:      { label: "● LIVE NOW",  color: "#2ecc71" },
  scheduled: { label: "scheduled",   color: "#8fd6f5" },
  unpaid:    { label: "unpaid hold", color: "#f4b740" },
  completed: { label: "completed",   color: "#8a8f96" },
};

export default function AdsPage() {
  const [me, setMe] = useState<{ username: string } | null | undefined>(undefined);
  const [boards, setBoards] = useState<BoardInfo[]>([]);
  const [avail, setAvail] = useState<Availability>({});
  const [price, setPrice] = useState(499);
  const [boardId, setBoardId] = useState("b1");
  const [dates, setDates] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [mine, setMine] = useState<MyBooking[]>([]);

  function loadMine() {
    fetch("/api/ads/mine").then(r => r.ok ? r.json() : { bookings: [] })
      .then(d => setMine(d.bookings || [])).catch(() => {});
  }

  async function editLink(b: MyBooking) {
    const v = window.prompt("Click-through link for this ad (players press E at the billboard to open it).\nLeave empty to remove:", b.linkUrl || "https://");
    if (v === null) return;
    const r = await fetch("/api/ads/mine", { method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: b.id, linkUrl: v.trim() || null }) });
    const d = await r.json();
    if (!r.ok) { setMsg(d.error || "Update failed."); return; }
    loadMine();
  }

  async function replaceMedia(b: MyBooking, list: FileList | null) {
    if (!list || !list.length) return;
    const fd = new FormData();
    for (const f of Array.from(list).slice(0, 5)) fd.append("files", f);
    const up = await fetch("/api/ads/upload", { method: "POST", body: fd });
    const upd = await up.json();
    if (!up.ok) { setMsg(upd.error || "Upload failed."); return; }
    const r = await fetch("/api/ads/mine", { method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: b.id, files: upd.files }) });
    const d = await r.json();
    if (!r.ok) { setMsg(d.error || "Update failed."); return; }
    setMsg(null); loadMine();
  }

  async function cancelBooking(b: MyBooking) {
    if (!window.confirm(`Cancel your ${b.boardName} ad on ${b.date}? The day opens up for others${b.phase !== "unpaid" ? " (no refund)" : ""}.`)) return;
    const r = await fetch(`/api/ads/mine?id=${b.id}`, { method: "DELETE" });
    const d = await r.json();
    if (!r.ok) { setMsg(d.error || "Cancel failed."); return; }
    loadMine();
  }

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      setMe(d.user ?? null);
      if (d.user) loadMine();
    }).catch(() => setMe(null));
    fetch("/api/ads/boards").then(r => r.json()).then(d => {
      setBoards(d.boards || []); setAvail(d.availability || {}); setPrice(d.priceCents || 499);
    }).catch(() => {});
    const q = new URLSearchParams(window.location.search);
    let bannerTimer: number | undefined;
    if (q.get("booked") === "1") {
      const n = Number(q.get("days") || 1);
      const message = `✅ Payment complete — your ad is booked on the ${q.get("board")} billboard for ${n > 1 ? `${n} days starting ${q.get("date")}` : q.get("date")}. It goes LIVE each booked day!`;
      bannerTimer = window.setTimeout(() => setBanner(message), 0);
    } else if (q.get("booked") === "0") {
      bannerTimer = window.setTimeout(() => setBanner("Checkout cancelled — the days were released for others."), 0);
    }
    if (q.has("booked")) window.history.replaceState({}, "", "/ads");
    return () => { if (bannerTimer !== undefined) window.clearTimeout(bannerTimer); };
  }, []);

  const days = avail[boardId] ? Object.keys(avail[boardId]).sort() : [];

  function toggleDate(d: string) {
    setDates(prev => prev.includes(d) ? prev.filter(x => x !== d) : prev.length >= 10 ? prev : [...prev, d]);
  }

  async function submit() {
    setMsg(null);
    if (!files.length) { setMsg("Add at least one image or video."); return; }
    if (!dates.length) { setMsg("Pick at least one day."); return; }
    setBusy(true);
    try {
      const fd = new FormData();
      for (const f of files) fd.append("files", f);
      const up = await fetch("/api/ads/upload", { method: "POST", body: fd });
      const upd = await up.json();
      if (!up.ok) { setMsg(upd.error || "Upload failed."); setBusy(false); return; }
      const bk = await fetch("/api/ads/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boardId, dates, files: upd.files, linkUrl: linkUrl.trim() || undefined }),
      });
      const bkd = await bk.json();
      if (!bk.ok) { setMsg(bkd.error || "Booking failed."); setBusy(false); return; }
      window.location.href = bkd.url; // off to Stripe
    } catch {
      setMsg("Could not reach the server."); setBusy(false);
    }
  }

  return (
    <main className="landing-overlay flex items-center justify-center p-4" style={{ overflowY: "auto" }}>
      <div className="auth-backdrop -z-10 animate-pulse-slow" />
      <div className="glass-panel auth-panel p-6 rounded-2xl relative overflow-hidden" style={{ maxWidth: "34rem", maxHeight: "92vh" }}>
        <div className="panel-border-shine" />
        <div className="mb-4 select-none text-center">
          <h1 className="title-glow text-2xl font-extrabold uppercase tracking-[0.2em] text-[#f4b740] font-sans">Advertise In-Game</h1>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400 mt-2 font-mono">
            3 giant billboards &bull; ${(price / 100).toFixed(2)}/day &bull; first come, first serve
          </p>
        </div>

        {banner && (
          <div className="auth-error" style={{ borderColor: "rgba(46,204,113,.4)", background: "rgba(46,204,113,.1)", color: "#b9f0cf", marginBottom: 12 }}>
            {banner}
          </div>
        )}

        {me === undefined ? (
          <p className="text-xs text-gray-400 font-mono text-center">Loading…</p>
        ) : me === null ? (
          <div className="text-center font-mono">
            <p className="text-sm text-gray-300 mb-4">Log in to book a billboard — your booking is tied to your account.</p>
            <Link href="/login" className="auth-link text-sm">Log in / Sign up →</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4 font-mono">
            <div className="auth-field">
              <label className="auth-label">1 · Pick your billboard</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {boards.map(b => (
                  <button key={b.id} onClick={() => setBoardId(b.id)}
                    className="btn-secondary py-2 px-2 text-[11px] font-bold"
                    style={boardId === b.id ? { borderColor: "#f4b740", color: "#f4b740" } : {}}>
                    📺 {b.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label">2 · Pick your days — select as many as you want (grey = taken)</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6 }}>
                {days.map(d => {
                  const free = avail[boardId]?.[d];
                  const sel = dates.includes(d);
                  return (
                    <button key={d} disabled={!free} onClick={() => toggleDate(d)}
                      className="btn-secondary py-2 px-1 text-[10px] font-bold"
                      style={{
                        opacity: free ? 1 : 0.3, cursor: free ? "pointer" : "not-allowed",
                        ...(sel ? { borderColor: "#2ecc71", color: "#2ecc71", background: "rgba(46,204,113,.12)" } : {}),
                      }}>
                      {sel ? "✓ " : ""}{d.slice(5)}
                    </button>
                  );
                })}
              </div>
              {dates.length > 0 && (
                <p className="text-[10px] text-gray-400 mt-1">
                  {dates.length} day{dates.length > 1 ? "s" : ""} selected · total ${((price * dates.length) / 100).toFixed(2)} (max 10 per checkout)
                </p>
              )}
            </div>

            <div className="auth-field">
              <label className="auth-label">3 · Your media (up to 5 — images & video cycle on the screen)</label>
              <input type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm"
                className="auth-input" style={{ padding: 8 }}
                onChange={e => setFiles(Array.from(e.target.files || []).slice(0, 5))} />
              {files.length > 0 && (
                <p className="text-[10px] text-gray-400 mt-1">
                  {files.map(f => f.name).join(" · ")} ({files.length}/5)
                </p>
              )}
              <p className="text-[10px] text-gray-500 mt-1">Images ≤2 MB (PNG/JPG/WebP/GIF) · video ≤20 MB (MP4/WebM). Landscape 16:9 looks best.</p>
            </div>

            <div className="auth-field">
              <label className="auth-label">4 · Click-through link (optional)</label>
              <input type="url" className="auth-input" placeholder="https://your-site.com"
                value={linkUrl} onChange={e => setLinkUrl(e.target.value)} />
              <p className="text-[10px] text-gray-500 mt-1">Players standing at your billboard press E to open it — every open is counted as a click in your metrics.</p>
            </div>

            {msg && <div className="auth-error">{msg}</div>}

            <button onClick={submit} disabled={busy}
              className="btn-primary py-3 px-6 text-sm uppercase tracking-widest font-bold">
              {busy ? "Uploading…" : dates.length
                ? `Book ${dates.length} day${dates.length > 1 ? "s" : ""} — pay $${((price * dates.length) / 100).toFixed(2)}`
                : "Pick your days above"}
            </button>
            <p className="text-[10px] text-gray-500 text-center leading-relaxed">
              Secure Stripe checkout. Your ad runs on the in-game billboard for each whole booked day (UTC),
              seen by every player in the city. Whoever pays first owns the day — all your days book together or not at all.
            </p>

            {mine.length > 0 && (
              <div className="auth-field" style={{ borderTop: "1px solid rgba(255,255,255,.1)", paddingTop: 14, marginTop: 4 }}>
                <label className="auth-label">Your ads — {mine.reduce((a, b) => a + b.views, 0).toLocaleString()} views · {mine.reduce((a, b) => a + b.clicks, 0).toLocaleString()} clicks all-time</label>
                <div className="flex flex-col gap-2">
                  {mine.map(b => {
                    const ph = PHASE_STYLE[b.phase];
                    return (
                      <div key={b.id} style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 10, padding: "10px 12px" }}>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-200 font-bold">📺 {b.boardName} · {b.date}</span>
                          <span className="text-[10px] font-bold" style={{ color: ph.color }}>{ph.label}</span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-[11px] text-gray-400">
                            👁 {b.views.toLocaleString()} views · 👆 {b.clicks.toLocaleString()} clicks
                            {b.views > 0 && <> · {(b.clicks / b.views * 100).toFixed(1)}% CTR</>}
                            &nbsp;· {b.media.length} file{b.media.length > 1 ? "s" : ""}{b.linkUrl ? " · 🔗" : ""}
                          </span>
                        </div>
                        {(b.phase === "scheduled" || b.phase === "live" || b.phase === "unpaid") && (
                          <div className="flex gap-2 mt-2">
                            <label className="btn-secondary py-1 px-2 text-[9px] font-bold" style={{ cursor: "pointer" }}>
                              replace media
                              <input type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm"
                                style={{ display: "none" }} onChange={e => replaceMedia(b, e.target.files)} />
                            </label>
                            <button onClick={() => editLink(b)} className="btn-secondary py-1 px-2 text-[9px] font-bold">edit link</button>
                            {b.phase !== "live" && (
                              <button onClick={() => cancelBooking(b)} className="btn-secondary py-1 px-2 text-[9px] font-bold" style={{ color: "#ef8080", borderColor: "rgba(239,80,80,.4)" }}>cancel</button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="text-[10px] text-gray-500 mt-2">Views = players who walked up to your billboard in-game (max 1/min each) · clicks = players who pressed E to open your link.</p>
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-gray-500 mt-5 text-center font-mono">
          <Link href="/" className="auth-link">← Back to the game</Link>
        </p>
      </div>
    </main>
  );
}
