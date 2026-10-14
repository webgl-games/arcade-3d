import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireAdmin, ADMIN_USERNAMES } from "@/lib/admin";
import { getDb } from "@/lib/mongodb";
import { ITEMS } from "@/lib/shop";

// Admin management actions: manage users and the contact inbox.
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  let body: { action?: unknown; id?: unknown; amount?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  const action = String(body.action || "");
  const id = String(body.id || "");
  const db = await getDb();
  let oid: ObjectId;
  try { oid = new ObjectId(id); } catch { return NextResponse.json({ error: "Bad id." }, { status: 400 }); }

  switch (action) {
    case "grantGold": {
      const amount = Math.max(0, Math.floor(Number(body.amount) || 0));
      await db.collection("users").updateOne({ _id: oid }, { $inc: { gold: amount } });
      return NextResponse.json({ ok: true });
    }
    case "grantAllItems": {
      await db.collection("users").updateOne({ _id: oid }, { $addToSet: { owned: { $each: Object.keys(ITEMS) } } });
      return NextResponse.json({ ok: true });
    }
    case "resetItems": {
      await db.collection("users").updateOne({ _id: oid }, { $set: { owned: [] } });
      return NextResponse.json({ ok: true });
    }
    case "deleteUser": {
      const u = await db.collection("users").findOne({ _id: oid }, { projection: { username: 1 } });
      if (u && ADMIN_USERNAMES.includes(String(u.username).toLowerCase()))
        return NextResponse.json({ error: "Can't delete an admin account." }, { status: 400 });
      await db.collection("users").deleteOne({ _id: oid });
      await db.collection("sessions").deleteMany({ userId: oid });
      return NextResponse.json({ ok: true });
    }
    case "readMessage": {
      await db.collection("contactMessages").updateOne({ _id: oid }, { $set: { read: true } });
      return NextResponse.json({ ok: true });
    }
    case "deleteMessage": {
      await db.collection("contactMessages").deleteOne({ _id: oid });
      return NextResponse.json({ ok: true });
    }
    default:
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }
}
