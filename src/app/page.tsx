import React from "react";
import { getSessionUser } from "@/lib/auth";
import GameShell from "@/components/GameShell";
import PublicLanding from "@/components/PublicLanding";
import AuthCorner from "@/components/AuthCorner";

// Rendered per-request so we can branch on the session (reading the cookie opts this
// route into dynamic rendering — intended). Guests with no cookie short-circuit inside
// getSessionUser() with zero DB cost, so crawlers get the marketing HTML fast.
export const dynamic = "force-dynamic";

/**
 * "/" is public. Logged-out visitors get a content-rich marketing page (server-rendered,
 * so search crawlers see real content, not a client-side "Loading…" shell).
 * Signed-in players get the full game shell. Login stays mandatory to *play*: every game
 * HTML file is still gated in proxy.ts, and only authenticated users ever render GameShell.
 */
export default async function Page() {
  const user = await getSessionUser();

  if (!user) {
    return (
      <main className="relative w-full min-h-screen overflow-x-hidden bg-[#12141a] text-white">
        <PublicLanding />
        <AuthCorner />
      </main>
    );
  }

  return <GameShell />;
}
