import { GridFSBucket, ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

// The three big billboards in the city (must match tiny-planet.html AD_BOARDS).
export const BOARDS: Record<string, { name: string }> = {
  b1: { name: "Downtown North" },
  b2: { name: "Market Square" },
  b3: { name: "Harbor View" },
};

export const AD_PRICE_CENTS = 499; // $4.99 per board per day
export const MAX_FILES = 5;
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB
export const MAX_VIDEO_BYTES = 20 * 1024 * 1024; // 20 MB
export const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
export const VIDEO_TYPES = ["video/mp4", "video/webm"];

export async function adBucket(): Promise<GridFSBucket> {
  const db = await getDb();
  return new GridFSBucket(db, { bucketName: "admedia" });
}

/** UTC calendar day, e.g. "2026-07-11" — one booking owns a board for one day. */
export function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}
export function isValidDay(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + "T00:00:00Z").getTime();
  const t0 = new Date(todayUTC() + "T00:00:00Z").getTime();
  return d >= t0 && d <= t0 + 30 * 86400000; // bookable today .. +30 days
}

export interface AdMediaRef {
  fileId: string;
  type: "image" | "video";
  contentType: string;
}

/**
 * FIRST-COME-FIRST-SERVE: a (boardId, date) slot is owned by whoever inserts
 * first. 'reserved' holds the slot during checkout (20 min); the Stripe webhook
 * flips it to 'active'. Expired reservations are swept before each attempt.
 */
export async function reserveSlot(
  boardId: string,
  date: string,
  userId: string,
  media: AdMediaRef[],
  linkUrl?: string
): Promise<{ ok: boolean; error?: string; bookingId?: string }> {
  const db = await getDb();
  const col = db.collection("adBookings");
  await col.createIndex(
    { boardId: 1, date: 1 },
    { unique: true, partialFilterExpression: { status: { $in: ["reserved", "active"] } } }
  );
  // free up abandoned checkouts holding this slot
  await col.deleteMany({
    boardId,
    date,
    status: "reserved",
    createdAt: { $lt: new Date(Date.now() - 20 * 60000) },
  });
  try {
    const r = await col.insertOne({
      boardId,
      date,
      userId,
      media,
      linkUrl: linkUrl || null,
      views: 0,
      clicks: 0,
      status: "reserved",
      createdAt: new Date(),
    });
    return { ok: true, bookingId: r.insertedId.toString() };
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && (e as { code: number }).code === 11000) {
      return { ok: false, error: "That day is already taken on this board — first come, first serve. Pick another day or board." };
    }
    throw e;
  }
}

/**
 * Reserve SEVERAL days at once, all-or-nothing: if any day is already taken,
 * every reservation made so far is rolled back and the caller gets a 409.
 */
export async function reserveSlots(
  boardId: string,
  dates: string[],
  userId: string,
  media: AdMediaRef[],
  linkUrl?: string
): Promise<{ ok: boolean; error?: string; bookingIds?: string[] }> {
  const got: string[] = [];
  for (const d of dates) {
    const r = await reserveSlot(boardId, d, userId, media, linkUrl);
    if (!r.ok) {
      if (got.length) {
        const db = await getDb();
        await db.collection("adBookings").deleteMany({ _id: { $in: got.map((id) => new ObjectId(id)) } });
      }
      return { ok: false, error: `${d} is already taken on this board — first come, first serve. Unselect it or pick another board.` };
    }
    got.push(r.bookingId!);
  }
  return { ok: true, bookingIds: got };
}

/** Stripe webhook confirms payment → the ad goes live for its day. */
export async function activateBooking(bookingId: string, sessionId: string): Promise<void> {
  const db = await getDb();
  await db.collection("adBookings").updateOne(
    { _id: new ObjectId(bookingId), status: "reserved" },
    { $set: { status: "active", sessionId, paidAt: new Date() } }
  );
}

/** Today's live ad for one board (what the in-game screen shows). */
export async function activeAd(
  boardId: string
): Promise<{ media: AdMediaRef[]; link: string | null } | null> {
  const db = await getDb();
  const b = await db
    .collection("adBookings")
    .findOne({ boardId, date: todayUTC(), status: "active" }, { projection: { media: 1, linkUrl: 1 } });
  return b ? { media: b.media as AdMediaRef[], link: (b.linkUrl as string) || null } : null;
}

/* ================= ADVERTISER DASHBOARD (My Ads) ================= */

/** Everything this advertiser has booked, newest day first, with metrics. */
export async function myBookings(userId: string) {
  const db = await getDb();
  const rows = await db
    .collection("adBookings")
    .find(
      { userId, status: { $in: ["reserved", "active"] } },
      { projection: { boardId: 1, date: 1, status: 1, media: 1, linkUrl: 1, views: 1, clicks: 1, createdAt: 1 } }
    )
    .sort({ date: -1 })
    .limit(60)
    .toArray();
  const today = todayUTC();
  return rows.map((r) => ({
    id: r._id.toString(),
    boardId: r.boardId,
    boardName: BOARDS[r.boardId as string]?.name || r.boardId,
    date: r.date,
    // phase the advertiser cares about: unpaid hold / scheduled / on screen NOW / finished
    phase: r.status === "reserved" ? "unpaid" : r.date === today ? "live" : r.date > today ? "scheduled" : "completed",
    media: r.media,
    linkUrl: r.linkUrl || null,
    views: r.views || 0,
    clicks: r.clicks || 0,
  }));
}

/** Update an upcoming/live booking's creative (media and/or click-through link). */
export async function updateBooking(
  userId: string,
  bookingId: string,
  patch: { media?: AdMediaRef[]; linkUrl?: string | null }
): Promise<{ ok: boolean; error?: string }> {
  const db = await getDb();
  const set: Record<string, unknown> = {};
  if (patch.media) set.media = patch.media;
  if (patch.linkUrl !== undefined) set.linkUrl = patch.linkUrl;
  if (!Object.keys(set).length) return { ok: false, error: "Nothing to update." };
  const r = await db.collection("adBookings").updateOne(
    { _id: new ObjectId(bookingId), userId, status: { $in: ["reserved", "active"] }, date: { $gte: todayUTC() } },
    { $set: set }
  );
  return r.matchedCount ? { ok: true } : { ok: false, error: "Booking not found (or its day already passed)." };
}

/** Cancel an upcoming booking → the day opens up for others. (No refunds on paid days.) */
export async function cancelBooking(userId: string, bookingId: string): Promise<{ ok: boolean; error?: string }> {
  const db = await getDb();
  const r = await db.collection("adBookings").deleteOne({
    _id: new ObjectId(bookingId),
    userId,
    status: { $in: ["reserved", "active"] },
    date: { $gt: todayUTC() }, // live-today and past days can't be cancelled
  });
  return r.deletedCount ? { ok: true } : { ok: false, error: "Only upcoming days can be cancelled." };
}

/** In-game exposure: +1 view (player saw the board) or +1 click (opened the link). */
export async function recordMetric(boardId: string, kind: "view" | "click"): Promise<void> {
  if (!BOARDS[boardId]) return;
  const db = await getDb();
  await db.collection("adBookings").updateOne(
    { boardId, date: todayUTC(), status: "active" },
    { $inc: kind === "view" ? { views: 1 } : { clicks: 1 } }
  );
}

/** Next-14-days availability per board, for the booking page. */
export async function availability(): Promise<Record<string, Record<string, boolean>>> {
  const db = await getDb();
  const t0 = todayUTC();
  const days: string[] = [];
  for (let i = 0; i < 14; i++)
    days.push(new Date(new Date(t0 + "T00:00:00Z").getTime() + i * 86400000).toISOString().slice(0, 10));
  const taken = await db
    .collection("adBookings")
    .find(
      { date: { $in: days }, status: { $in: ["reserved", "active"] } },
      { projection: { boardId: 1, date: 1 } }
    )
    .toArray();
  const out: Record<string, Record<string, boolean>> = {};
  for (const id of Object.keys(BOARDS)) {
    out[id] = {};
    for (const d of days) out[id][d] = true; // true = free
  }
  for (const t of taken) if (out[t.boardId]) out[t.boardId][t.date] = false;
  return out;
}
