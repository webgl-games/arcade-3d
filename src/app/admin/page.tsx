"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface Metrics {
  totalUsers: number; newUsers7: number; totalGold: number; unread: number;
  totalMessages: number; activeAds: number; reservedAds: number; goldPacksSold: number; adRevenueUsd: string;
}
interface UserRow { id: string; name: string; username: string; age: number; gender: string; gold: number; owned: string[]; createdAt: string }
interface MsgRow { id: string; name: string; email: string; subject: string; message: string; fromUsername: string | null; read: boolean; createdAt: string }
interface AdRow { boardId: string; date: string; status: string; views: number; clicks: number }
interface Data { admin: string; metrics: Metrics; users: UserRow[]; messages: MsgRow[]; ads: AdRow[] }

const fmt = (d: string) => (d ? new Date(d).toLocaleString() : "—");

export default function AdminPage() {
  const [state, setState] = useState<"loading" | "denied" | "ready">("loading");
  const [data, setData] = useState<Data | null>(null);
  const [tab, setTab] = useState<"metrics" | "users" | "messages" | "ads">("metrics");

  const load = useCallback(() => {
    fetch("/api/admin/data").then(async (r) => {
      if (r.status === 403 || r.status === 401) { setState("denied"); return; }
      const d = await r.json();
      setData(d); setState("ready");
    }).catch(() => setState("denied"));
  }, []);
  useEffect(() => { load(); }, [load]);

  async function act(action: string, id: string, amount?: number) {
    await fetch("/api/admin/action", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, id, amount }),
    });
    load();
  }

  if (state === "loading") return <Shell><p className="text-gray-400 font-mono text-sm">Loading…</p></Shell>;
  if (state === "denied") return (
    <Shell>
      <p className="text-gray-300 font-mono text-sm mb-4">🔒 Admins only. Log in with an admin account.</p>
      <Link href="/login" className="auth-link font-mono text-sm">Log in →</Link>
    </Shell>
  );
  if (!data) return null;
  const m = data.metrics;

  return (
    <main style={{ minHeight: "100vh", background: "var(--background)", color: "var(--paper)", padding: "24px 16px", fontFamily: "'Space Mono', monospace" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div className="flex justify-between items-center" style={{ marginBottom: 18 }}>
          <div>
            <h1 className="title-glow" style={{ fontSize: 26, fontWeight: 800, color: "#f4b740", letterSpacing: 2 }}>ADMIN · ARCADE 3D</h1>
            <p style={{ fontSize: 11, color: "#8a8f96" }}>signed in as {data.admin} · <Link href="/" className="auth-link">back to game</Link></p>
          </div>
          <button onClick={load} className="btn-secondary" style={{ padding: "8px 14px", fontSize: 11, fontWeight: 700 }}>↻ Refresh</button>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {(["metrics", "users", "messages", "ads"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className="btn-secondary"
              style={{ padding: "8px 16px", fontSize: 12, fontWeight: 700, textTransform: "uppercase",
                ...(tab === t ? { borderColor: "#f4b740", color: "#f4b740" } : {}) }}>
              {t}{t === "messages" && m.unread > 0 ? ` (${m.unread})` : ""}
            </button>
          ))}
        </div>

        {tab === "metrics" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12 }}>
            <Stat label="Total players" value={m.totalUsers} />
            <Stat label="New this week" value={m.newUsers7} />
            <Stat label="Gold in circulation" value={<span style={{ color: "#f4b740" }}>{m.totalGold.toLocaleString()}</span>} />
            <Stat label="Gold packs sold" value={m.goldPacksSold} />
            <Stat label="Live ad campaigns" value={m.activeAds} />
            <Stat label="Reserved ads" value={m.reservedAds} />
            <Stat label="Ad revenue (gross)" value={"$" + m.adRevenueUsd} />
            <Stat label="Contact messages" value={m.totalMessages} sub={m.unread + " unread"} />
          </div>
        )}

        {tab === "users" && (
          <Table cols={["Player", "Age/Gender", "Gold", "Items", "Joined", "Actions"]}>
            {data.users.map((u) => (
              <tr key={u.id} style={{ borderBottom: "1px solid rgba(255,255,255,.07)" }}>
                <td style={td}><b style={{ color: "#eaeaea" }}>{u.username}</b><div style={{ color: "#8a8f96", fontSize: 10 }}>{u.name}</div></td>
                <td style={td}>{u.age} · {u.gender}</td>
                <td style={{ ...td, color: "#f4b740" }}>{u.gold.toLocaleString()}</td>
                <td style={td}>{u.owned.length ? u.owned.join(", ") : "—"}</td>
                <td style={{ ...td, fontSize: 10, color: "#8a8f96" }}>{fmt(u.createdAt)}</td>
                <td style={td}>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    <Mini onClick={() => act("grantGold", u.id, 1000)}>+1k gold</Mini>
                    <Mini onClick={() => act("grantAllItems", u.id)}>all items</Mini>
                    <Mini onClick={() => { if (confirm(`Delete ${u.username}?`)) act("deleteUser", u.id); }} danger>delete</Mini>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}

        {tab === "messages" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {data.messages.length === 0 && <p style={{ color: "#8a8f96", fontSize: 13 }}>No messages yet.</p>}
            {data.messages.map((msg) => (
              <div key={msg.id} style={{ background: msg.read ? "rgba(255,255,255,.03)" : "rgba(244,183,64,.08)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 10, padding: "12px 14px" }}>
                <div className="flex justify-between items-start" style={{ gap: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <b style={{ color: "#eaeaea", fontSize: 13 }}>{msg.subject}</b>
                    {!msg.read && <span style={{ color: "#f4b740", fontSize: 10, marginLeft: 8 }}>● NEW</span>}
                    <div style={{ color: "#9aa0a6", fontSize: 11, marginTop: 2 }}>
                      {msg.name} · <a href={`mailto:${msg.email}`} className="auth-link">{msg.email}</a>{msg.fromUsername ? ` · @${msg.fromUsername}` : ""} · {fmt(msg.createdAt)}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {!msg.read && <Mini onClick={() => act("readMessage", msg.id)}>mark read</Mini>}
                    <Mini onClick={() => { if (confirm("Delete message?")) act("deleteMessage", msg.id); }} danger>delete</Mini>
                  </div>
                </div>
                <p style={{ color: "#c4d0df", fontSize: 12.5, marginTop: 8, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{msg.message}</p>
              </div>
            ))}
          </div>
        )}

        {tab === "ads" && (
          <Table cols={["Board", "Date", "Status", "Views", "Clicks"]}>
            {data.ads.length === 0
              ? <tr><td style={td} colSpan={5}>No ad bookings.</td></tr>
              : data.ads.map((a, i) => (
                <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,.07)" }}>
                  <td style={td}>{a.boardId}</td>
                  <td style={td}>{a.date}</td>
                  <td style={{ ...td, color: a.status === "active" ? "#2ecc71" : "#f4b740" }}>{a.status}</td>
                  <td style={td}>{a.views}</td>
                  <td style={td}>{a.clicks}</td>
                </tr>
              ))}
          </Table>
        )}
      </div>
    </main>
  );
}

const td: React.CSSProperties = { padding: "9px 10px", fontSize: 12, verticalAlign: "top" };

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="landing-overlay flex items-center justify-center p-4">
      <div className="auth-backdrop -z-10" />
      <div className="glass-panel auth-panel p-6 rounded-2xl text-center">
        <h1 className="title-glow text-xl font-extrabold uppercase tracking-[0.2em] text-[#f4b740] font-sans mb-4">Admin</h1>
        {children}
      </div>
    </main>
  );
}
function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 12, padding: "14px 16px" }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: "#eaeaea" }}>{value}</div>
      <div style={{ fontSize: 10.5, color: "#8a8f96", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: "#f4b740", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}
function Table({ cols, children }: { cols: string[]; children: React.ReactNode }) {
  return (
    <div style={{ overflowX: "auto", border: "1px solid rgba(255,255,255,.1)", borderRadius: 12 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
        <thead><tr>{cols.map((c) => <th key={c} style={{ textAlign: "left", padding: "10px", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "#8a8f96", borderBottom: "1px solid rgba(255,255,255,.12)" }}>{c}</th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
function Mini({ children, onClick, danger }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} style={{
      cursor: "pointer", fontFamily: "inherit", fontSize: 10, fontWeight: 700, borderRadius: 6, padding: "4px 8px",
      background: "rgba(255,255,255,.06)", border: `1px solid ${danger ? "rgba(239,80,80,.4)" : "rgba(255,255,255,.2)"}`,
      color: danger ? "#ef8080" : "#dfe8f2",
    }}>{children}</button>
  );
}
