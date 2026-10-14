"use client";

import React, { useState, useEffect, useRef } from "react";
import LandingPage, { GameMode } from "@/components/LandingPage";
import AuthCorner from "@/components/AuthCorner";
import { audio } from "@/utils/audio";

// Each game mode is a self-contained game served from public/ and embedded in an
// iframe. This keeps modes fully isolated (no shared-state bugs) and preserves
// 100% parity with each standalone game file.
const MODE_SRC: Record<GameMode, string> = {
  explore: "/tiny-planet.html",
  tdm: "/team-deathmatch.html",
  br: "/battle-royale.html",
  destruction: "/destruction.html",
  rocket: "/rocket-mission.html",
};
const MODE_LABEL: Record<GameMode, string> = {
  explore: "Explore",
  tdm: "Team Deathmatch",
  br: "Battle Royale",
  destruction: "Destruction",
  rocket: "Rocket Mission",
};

// Each game packs its HUD into different corners, so the shell's Exit button is
// pinned to whatever corner is free in that mode (avoids overlapping money/health/etc).
const TL = { top: 12, left: 12, right: "auto", bottom: "auto" } as const;
const BL = { top: "auto", left: 12, right: "auto", bottom: 12 } as const;
const BR = { top: "auto", left: "auto", right: 12, bottom: 12 } as const;
const EXIT_STYLE: Record<GameMode, React.CSSProperties> = {
  explore: BL,      // top-left=money/quest, top-center=title, top-right=score → bottom-left free
  br: TL,           // Battle Royale leaves the top-left corner empty
  tdm: BR,          // health/points bottom-left, voice top-left, feed top-right → bottom-right free
  destruction: BR,
  rocket: BR,       // telemetry bottom-left, panel top-right → bottom-right free
};

/**
 * The signed-in experience: the polished landing/menu, and on "Start" it mounts the
 * *canonical* game full-screen in an iframe. This guarantees the in-app experience is
 * byte-for-byte identical to the original HTML — every island, vehicle, mission, the
 * world map, store, police, rockets, etc. — with no porting drift. Only rendered for
 * authenticated players (guests get the public marketing page instead — see page.tsx).
 */
export default function GameShell() {
  const [mode, setMode] = useState<GameMode | null>(null);
  const isPlaying = mode !== null;

  // Landing-page settings. The canonical game owns its own runtime controls,
  // so these persist menu state without mutating the embedded game.
  const [curvature, setCurvature] = useState(0.003);
  const [volume, setVolume] = useState(0.5);

  // When the player uses the launch console at the Launch Site in Explore, the
  // game posts a message and we overlay the Mission Control room on top of the still-
  // running world. Completing the launch there grants the achievement back in-game.
  const [controlRoom, setControlRoom] = useState(false);

  const frameRef = useRef<HTMLIFrameElement>(null);

  // Returning from Stripe checkout: ?paid=1&gold=N (success) or ?paid=0 (cancelled).
  // The gold is already credited server-side by the webhook; this is just the banner.
  const [payMsg, setPayMsg] = useState<string | null>(null);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.has("paid")) {
      const message = q.get("paid") === "1"
        ? `✅ Payment complete${q.get("gold") ? ` — ${(+q.get("gold")!).toLocaleString()} gold added` : ""}! It's on your account. Start Explore to spend it.`
        : "Checkout cancelled — no charge was made.";
      const t = window.setTimeout(() => setPayMsg(message), 0);
      // clean the URL so a refresh doesn't re-show the banner
      window.history.replaceState({}, "", window.location.pathname);
      const clear = window.setTimeout(() => setPayMsg(null), 8000);
      return () => {
        window.clearTimeout(t);
        window.clearTimeout(clear);
      };
    }
  }, []);

  useEffect(() => {
    audio.setVolume(volume);
  }, [volume]);

  // Bridge messages between the Explore game and the Mission Control overlay.
  useEffect(() => {
    function onMsg(e: MessageEvent) {
      const data = e.data;
      if (!data || typeof data !== "object") return;
      if (data.type === "tp-open-control-room") {
        setControlRoom(true);
      } else if (data.type === "sx-mission-complete") {
        // relay the achievement grant back into the Explore game
        try {
          frameRef.current?.contentWindow?.postMessage({ type: "tp-grant-launch" }, "*");
        } catch {
          /* same-origin; safe */
        }
      }
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  // Give the game keyboard focus as soon as it mounts so WASD works immediately.
  useEffect(() => {
    if (isPlaying && frameRef.current) {
      const f = frameRef.current;
      const focus = () => {
        try {
          f.contentWindow?.focus();
        } catch {
          /* cross-origin guard — same-origin here, but stay safe */
        }
      };
      f.addEventListener("load", focus);
      return () => f.removeEventListener("load", focus);
    }
  }, [isPlaying]);

  const handleExitToMenu = () => {
    audio.playTalk();
    setControlRoom(false);
    setMode(null);
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#a7dad3]">
      {/* The active game mode */}
      {mode && (
        <>
          <iframe
            ref={frameRef}
            src={MODE_SRC[mode]}
            title={MODE_LABEL[mode]}
            className="absolute inset-0 w-full h-full border-0 z-0"
            allow="autoplay; fullscreen; gamepad; pointer-lock; microphone"
          />

          {/* Minimal shell control — exit back to the menu */}
          <button
            onClick={handleExitToMenu}
            title="Exit to Main Menu"
            className="exit-to-menu-btn"
            style={EXIT_STYLE[mode]}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            <span className="exit-btn-label">Exit</span>
          </button>

          {/* Mission Control room — overlays the running Explore world when you use the
              launch console at the Launch Site */}
          {mode === "explore" && controlRoom && (
            <div className="absolute inset-0 z-30 bg-black">
              <iframe
                src="/rocket-mission.html"
                title="Mission Control"
                className="absolute inset-0 w-full h-full border-0"
                allow="autoplay; fullscreen; pointer-lock"
              />
              <button
                onClick={() => setControlRoom(false)}
                title="Back to the island"
                className="absolute top-4 right-4 z-10 bg-[#121722]/90 hover:bg-[#121722] text-[#e8eef6] border border-[#26344a] rounded-full py-1.5 px-4 text-[11px] font-mono font-bold uppercase tracking-wider shadow-lg backdrop-blur-sm transition-all select-none"
              >
                ✕ Back to the island
              </button>
            </div>
          )}
        </>
      )}

      {/* Start screen / menu */}
      {!isPlaying && (
        <>
          <LandingPage
            onStartGame={(m) => { setControlRoom(false); setMode(m); }}
            curvature={curvature}
            onCurvatureChange={setCurvature}
            volume={volume}
            onVolumeChange={setVolume}
          />
          <AuthCorner />
        </>
      )}

      {payMsg && (
        <div
          role="status"
          style={{
            position: "fixed",
            top: 16,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 90,
            maxWidth: "90vw",
            background: "rgba(18,25,20,0.96)",
            border: "1px solid rgba(46,204,113,0.5)",
            color: "#eafff2",
            borderRadius: 12,
            padding: "12px 18px",
            fontFamily: "'Space Mono', ui-monospace, monospace",
            fontSize: 13,
            fontWeight: 700,
            boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
          }}
        >
          {payMsg}
        </div>
      )}
    </main>
  );
}
