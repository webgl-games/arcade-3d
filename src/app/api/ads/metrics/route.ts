import { NextResponse } from "next/server";
import { recordMetric } from "@/lib/ads";

// In-game exposure beacons: the Explore client reports when players actually
// SEE a booked billboard (view) or press E to open its link (click).
export async function POST(request: Request) {
  let body: { boardId?: unknown; kind?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  const boardId = typeof body.boardId === "string" ? body.boardId : "";
  const kind = body.kind === "click" ? "click" : body.kind === "view" ? "view" : null;
  if (!boardId || !kind) return NextResponse.json({ ok: false }, { status: 400 });
  try { await recordMetric(boardId, kind); } catch { /* metrics are best-effort */ }
  return NextResponse.json({ ok: true });
}
