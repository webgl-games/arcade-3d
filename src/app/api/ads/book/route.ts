import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getStripe } from "@/lib/shop";
import { BOARDS, AD_PRICE_CENTS, MAX_FILES, isValidDay, reserveSlots, AdMediaRef } from "@/lib/ads";

const MAX_DAYS = 10; // per checkout (Stripe metadata comfortably fits 10 booking ids)

// Reserve a board for ONE OR MORE days (first come, first serve, all-or-nothing)
// and open a single Stripe checkout for days × $4.99. Payment makes them live.
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Log in first." }, { status: 401 });

  let body: { boardId?: unknown; date?: unknown; dates?: unknown; files?: unknown; linkUrl?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  const boardId = typeof body.boardId === "string" ? body.boardId : "";
  // accept dates[] (new multi-select) or a single date (old clients)
  const rawDates = Array.isArray(body.dates)
    ? (body.dates as unknown[]).filter((d): d is string => typeof d === "string")
    : typeof body.date === "string" ? [body.date] : [];
  const dates = [...new Set(rawDates)].sort();
  const files = Array.isArray(body.files) ? (body.files as AdMediaRef[]) : [];
  if (!BOARDS[boardId]) return NextResponse.json({ error: "Unknown board." }, { status: 400 });
  if (!dates.length || dates.length > MAX_DAYS)
    return NextResponse.json({ error: `Pick 1–${MAX_DAYS} days.` }, { status: 400 });
  if (dates.some((d) => !isValidDay(d)))
    return NextResponse.json({ error: "Days must be between today and 30 days out." }, { status: 400 });
  if (!files.length || files.length > MAX_FILES || files.some((f) => !f.fileId || (f.type !== "image" && f.type !== "video")))
    return NextResponse.json({ error: "Upload 1–5 images/videos first." }, { status: 400 });
  // optional click-through link: players press E at the billboard to open it (counted as a click)
  let linkUrl: string | undefined;
  if (typeof body.linkUrl === "string" && body.linkUrl.trim()) {
    try {
      const u = new URL(body.linkUrl.trim());
      if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error();
      linkUrl = u.toString();
    } catch {
      return NextResponse.json({ error: "The link must be a valid http(s) URL." }, { status: 400 });
    }
  }

  const slots = await reserveSlots(boardId, dates, user.id, files, linkUrl);
  if (!slots.ok) return NextResponse.json({ error: slots.error }, { status: 409 });

  const origin = new URL(request.url).origin;
  const stripe = getStripe();
  const dayLabel = dates.length === 1 ? dates[0] : `${dates.length} days (${dates[0]} → ${dates[dates.length - 1]})`;
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: dates.length,
        price_data: {
          currency: "usd",
          unit_amount: AD_PRICE_CENTS,
          product_data: { name: `Arcade 3D Billboard — ${BOARDS[boardId].name} · ${dayLabel}` },
        },
      },
    ],
    client_reference_id: user.id,
    metadata: { kind: "ad", bookingId: slots.bookingIds!.join(","), userId: user.id },
    success_url: `${origin}/ads?booked=1&board=${encodeURIComponent(BOARDS[boardId].name)}&date=${dates[0]}&days=${dates.length}`,
    cancel_url: `${origin}/ads?booked=0`,
  });
  return NextResponse.json({ url: session.url });
}
