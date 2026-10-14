"use client";

import React, { useState, useEffect } from "react";
import { getHighscores, getAchievements, resetSaveData } from "@/utils/storage";
import { audio } from "@/utils/audio";

export type GameMode = "explore" | "tdm" | "br" | "destruction" | "rocket";

interface LandingPageProps {
  onStartGame: (mode: GameMode) => void;
  curvature: number;
  onCurvatureChange: (val: number) => void;
  volume: number;
  onVolumeChange: (val: number) => void;
}

export default function LandingPage({
  onStartGame,
  curvature,
  onCurvatureChange,
  volume,
  onVolumeChange,
}: LandingPageProps) {
  const [activeTab, setActiveTab] = useState<"menu" | "achievements" | "settings" | "leaderboard">("menu");
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetCounter, setResetCounter] = useState(0);
  // Pause police chases inside the Explore game. Persisted in localStorage; the
  // game reads it on boot and live via the same-origin storage event.
  const [policeOff, setPoliceOff] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setPoliceOff(localStorage.getItem("tp-police-off") === "1"), 0);
    return () => window.clearTimeout(timer);
  }, []);
  const togglePolice = (off: boolean) => {
    audio.playTalk();
    setPoliceOff(off);
    localStorage.setItem("tp-police-off", off ? "1" : "0");
  };

  const highscores = activeTab === "leaderboard" ? getHighscores() : [];
  const achievements = activeTab === "achievements" ? getAchievements() : [];

  const handleStart = (mode: GameMode) => {
    audio.playPickup();
    onStartGame(mode);
  };

  const handleResetData = () => {
    resetSaveData();
    setConfirmReset(false);
    setResetCounter((c) => c + 1);
    audio.playDelivery();
  };

  return (
    <div key={resetCounter} className="landing-overlay flex items-center justify-center p-4">
      {/* Background Animated Gradient */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#1b1c22] via-[#232530] to-[#16222f] -z-10 animate-pulse-slow" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(244,183,64,0.08)_0%,_transparent_65%)] -z-10" />

      {/* Main Glass Panel */}
      <div className="glass-panel max-w-lg w-full p-6 md:p-8 rounded-2xl flex flex-col items-center text-center relative overflow-hidden max-h-[90vh]">
        <div className="panel-border-shine" />

        {/* Game Title */}
        <div className="mb-8 select-none">
          <h1 className="title-glow text-3xl md:text-4xl font-extrabold uppercase tracking-[0.2em] text-[#f4b740] font-sans">
            Arcade 3D
          </h1>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400 mt-2 font-mono">
            Drive &bull; Fly &bull; Battle &bull; City to Mars
          </p>
        </div>

        {/* Tab Content Router */}
        <div className="w-full flex-1 overflow-y-auto mb-6 pr-1 custom-scrollbar">
          {activeTab === "menu" && (
            <div className="flex flex-col gap-4 py-2">
              <span className="text-[9px] uppercase tracking-[0.3em] text-gray-500 font-mono -mb-1">Game Modes</span>

              <button onClick={() => handleStart("explore")} className="btn-primary py-3 px-6 text-sm uppercase tracking-widest font-bold font-mono flex flex-col items-center gap-0.5">
                <span>Start Explore</span>
                <span className="text-[8px] tracking-wider opacity-70 normal-case font-normal">Open world: drive, fly, trains, rockets, Moon &amp; Mars</span>
              </button>

              <button onClick={() => handleStart("tdm")} className="btn-secondary py-3 px-6 text-sm uppercase tracking-widest font-bold font-mono flex flex-col items-center gap-0.5 hover:border-red-500/60">
                <span className="flex items-center gap-2">Team Deathmatch <span className="text-[8px] bg-red-500/20 text-red-400 py-0.5 px-1.5 rounded-full">4 v 4</span></span>
                <span className="text-[8px] tracking-wider opacity-60 normal-case font-normal">LIVE 4v4 — real players, real voice chat, first to 25</span>
              </button>

              <button onClick={() => handleStart("br")} className="btn-secondary py-3 px-6 text-sm uppercase tracking-widest font-bold font-mono flex flex-col items-center gap-0.5 hover:border-amber-500/60">
                <span className="flex items-center gap-2">Battle Royale <span className="text-[8px] bg-amber-500/20 text-amber-400 py-0.5 px-1.5 rounded-full">DROP</span></span>
                <span className="text-[8px] tracking-wider opacity-60 normal-case font-normal">LIVE drop — real players only, invite friends, squad voice</span>
              </button>

              <button onClick={() => handleStart("destruction")} className="btn-secondary py-3 px-6 text-sm uppercase tracking-widest font-bold font-mono flex flex-col items-center gap-0.5 hover:border-emerald-500/60">
                <span className="flex items-center gap-2">Destruction <span className="text-[8px] bg-emerald-500/20 text-emerald-400 py-0.5 px-1.5 rounded-full">SANDBOX</span></span>
                <span className="text-[8px] tracking-wider opacity-60 normal-case font-normal">LIVE co-op — smash the same city with real players</span>
              </button>

              {/* Rocket Mission is reachable in-game: use the Launch Control console
                  at the Launch Site in Explore (it opens Mission Control) */}
              <div className="grid grid-cols-3 gap-2 mt-2">
                <button onClick={() => { audio.playTalk(); setActiveTab("achievements"); }} className="btn-secondary py-2 px-2 text-[10px] uppercase tracking-wider font-bold font-mono">
                  Badges
                </button>
                <button onClick={() => { audio.playTalk(); setActiveTab("leaderboard"); }} className="btn-secondary py-2 px-2 text-[10px] uppercase tracking-wider font-bold font-mono">
                  Records
                </button>
                <button onClick={() => { audio.playTalk(); setActiveTab("settings"); }} className="btn-secondary py-2 px-2 text-[10px] uppercase tracking-wider font-bold font-mono">
                  Settings
                </button>
              </div>
              <a href="/ads" className="btn-secondary py-2 px-2 text-[10px] uppercase tracking-wider font-bold font-mono text-center block hover:border-amber-500/60" style={{ textDecoration: "none" }}>
                📺 Advertise on the city billboards — $4.99/day
              </a>
            </div>
          )}

          {activeTab === "achievements" && (
            <div className="text-left py-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-300 mb-4 font-mono pb-2 border-b border-gray-700">
                Unlocked Badges
              </h2>
              <div className="flex flex-col gap-3">
                {achievements.map((ach) => (
                  <div key={ach.id} className={`flex items-center gap-4 p-3 rounded-lg border transition-all ${ach.unlocked ? "bg-amber-950/20 border-amber-600/40" : "bg-zinc-900/40 border-zinc-800"}`}>
                    <div className="text-2xl select-none">{ach.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-bold font-sans ${ach.unlocked ? "text-amber-400" : "text-gray-500"}`}>
                          {ach.title}
                        </span>
                        {ach.unlocked ? (
                          <span className="text-[10px] bg-amber-500/20 text-amber-400 py-0.5 px-2 rounded-full font-mono uppercase">
                            Unlocked
                          </span>
                        ) : (
                          <span className="text-[10px] bg-zinc-800 text-gray-500 py-0.5 px-2 rounded-full font-mono uppercase">
                            Locked
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{ach.desc}</p>
                      {ach.unlocked && ach.unlockedAt && (
                        <p className="text-[9px] text-gray-500 mt-1 font-mono">Completed: {ach.unlockedAt}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "leaderboard" && (
            <div className="text-left py-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-300 mb-4 font-mono pb-2 border-b border-gray-700">
                Local Records
              </h2>
              {highscores.length === 0 ? (
                <div className="text-center py-8 text-gray-500 font-mono text-sm">
                  No deliveries registered yet. Keep delivering to rank up!
                </div>
              ) : (
                <div className="flex flex-col gap-2 font-mono">
                  {highscores.map((entry, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-zinc-900/40 border border-zinc-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full ${idx === 0 ? "bg-amber-400 text-black" : "bg-zinc-800 text-gray-400"}`}>
                          {idx + 1}
                        </span>
                        <span className="text-sm text-gray-200">{entry.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-gray-500">{entry.date}</span>
                        <span className="text-sm font-bold text-amber-400">{entry.score} pts</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "settings" && (
            <div className="text-left py-2 flex flex-col gap-6">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-300 mb-4 font-mono pb-2 border-b border-gray-700">
                  Audio Config
                </h2>
                <div className="flex flex-col gap-2 font-mono">
                  <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
                    <span>SFX Volume</span>
                    <span>{Math.round(volume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                    className="volume-slider w-full accent-[#f4b740]"
                  />
                </div>
              </div>

              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-300 mb-4 font-mono pb-2 border-b border-gray-700">
                  World Physics Shader
                </h2>
                <div className="flex flex-col gap-2 font-mono">
                  <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
                    <span>Planet Curvature</span>
                    <span>{(curvature * 1000).toFixed(1)}k</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="0.01"
                    step="0.0005"
                    value={curvature}
                    onChange={(e) => onCurvatureChange(parseFloat(e.target.value))}
                    className="curvature-slider w-full accent-[#f4b740]"
                  />
                  <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                    Adjusts the real-time vertex shader bending parameter. Slide right to make the planet feel smaller and more curved.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-300 mb-4 font-mono pb-2 border-b border-gray-700">
                  Gameplay
                </h2>
                <div className="flex justify-between items-center font-mono">
                  <div>
                    <span className="text-xs text-gray-400">Police Chases</span>
                    <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">
                      Off = no wanted stars and no cop cars chasing you in Explore.
                    </p>
                  </div>
                  <button
                    onClick={() => togglePolice(!policeOff)}
                    className={`text-[10px] font-bold uppercase tracking-widest py-1.5 px-2 rounded-lg border transition-all ${
                      policeOff
                        ? "bg-zinc-800 text-gray-500 border-gray-700"
                        : "bg-amber-500/20 text-amber-400 border-amber-600/40"
                    }`}
                  >
                    {policeOff ? "Paused" : "On"}
                  </button>
                </div>
              </div>

              <div className="mt-2 pt-4 border-t border-gray-800">
                {!confirmReset ? (
                  <button
                    onClick={() => { audio.playTalk(); setConfirmReset(true); }}
                    className="w-full bg-red-950/20 text-red-400 border border-red-900/60 py-2.5 rounded-lg text-xs font-mono font-bold hover:bg-red-900/20 hover:border-red-500 transition-all"
                  >
                    Reset All Save Data
                  </button>
                ) : (
                  <div className="bg-red-950/20 border border-red-500/30 p-3 rounded-lg flex flex-col gap-3">
                    <p className="text-xs text-red-300 font-mono text-center">
                      Wipe all local high scores and unlocked achievements? This cannot be undone.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleResetData}
                        className="flex-1 bg-red-600 text-white font-bold py-1.5 rounded text-xs font-mono"
                      >
                        Yes, Reset
                      </button>
                      <button
                        onClick={() => { audio.playTalk(); setConfirmReset(false); }}
                        className="flex-1 bg-zinc-800 text-gray-300 py-1.5 rounded text-xs font-mono"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Button */}
        {activeTab !== "menu" && (
          <button
            onClick={() => { audio.playTalk(); setActiveTab("menu"); setConfirmReset(false); }}
            className="w-full mt-auto py-2 border border-gray-700 rounded-lg hover:border-gray-500 text-xs font-mono text-gray-400 uppercase tracking-widest transition-all"
          >
            &lsaquo; Back to Menu
          </button>
        )}
      </div>
    </div>
  );
}
