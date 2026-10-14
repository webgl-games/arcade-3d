import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Login/signup is MANDATORY to play. Every game file is gated: no session cookie →
// bounce to /login. (Optimistic cookie-presence check per the Next.js docs; the API
// routes still validate the session for real.) "/" is intentionally NOT gated — it
// serves a public marketing page to guests (so search crawlers can index it) and the
// signed-in game menu to players; app/page.tsx branches on the session, not the proxy.
const GAME_PATHS = new Set([
  "/tiny-planet.html",
  "/battle-royale.html",
  "/team-deathmatch.html",
  "/destruction.html",
  "/rocket-mission.html",
]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!GAME_PATHS.has(pathname)) return NextResponse.next();
  if (request.cookies.has("tp_session")) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = ""; // clean redirect to the login screen
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/tiny-planet.html",
    "/battle-royale.html",
    "/team-deathmatch.html",
    "/destruction.html",
    "/rocket-mission.html",
  ],
};
