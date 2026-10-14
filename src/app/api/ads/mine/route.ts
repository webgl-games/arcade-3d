import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { myBookings, updateBooking, cancelBooking, MAX_FILES, AdMediaRef } from "@/lib/ads";

// The advertiser's own dashboard: list / edit / cancel their billboard days.

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Log in first." }, { status: 401 });
  return NextResponse.json({ bookings: await myBookings(user.id) });
}

function validLink(s: unknown): string | null | undefined {
  if (s === null || s === "") return null;            // explicit clear
  if (typeof s !== "string") return undefined;         // not provided
  try {
    const u = new URL(s);
    if (u.protocol === "http:" || u.protocol === "https:") return u.toString();
  } catch { /* fallthrough */ }
  return undefined;
}

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Log in first." }, { status: 401 });
  let body: { bookingId?: unknown; files?: unknown; linkUrl?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Bad request." }, { status: 400 }); }
  const bookingId = typeof body.bookingId === "string" ? body.bookingId : "";
  if (!bookingId) return NextResponse.json({ error: "Missing booking." }, { status: 400 });

  const patch: { media?: AdMediaRef[]; linkUrl?: string | null } = {};
  if (Array.isArray(body.files)) {
    const files = body.files as AdMediaRef[];
    if (!files.length || files.length > MAX_FILES || files.some((f) => !f.fileId || (f.type !== "image" && f.type !== "video")))
      return NextResponse.json({ error: "Bad media list." }, { status: 400 });
    patch.media = files;
  }
  if (body.linkUrl !== undefined) {
    const link = validLink(body.linkUrl);
    if (link === undefined) return NextResponse.json({ error: "Link must be a valid http(s) URL." }, { status: 400 });
    patch.linkUrl = link;
  }
  const r = await updateBooking(user.id, bookingId, patch);
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Log in first." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id") || "";
  if (!id) return NextResponse.json({ error: "Missing booking." }, { status: 400 });
  const r = await cancelBooking(user.id, id);
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
