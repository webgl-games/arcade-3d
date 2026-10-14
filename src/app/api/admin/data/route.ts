import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getDb } from "@/lib/mongodb";

// One call powers the whole admin dashboard: metrics + users + messages + ad bookings.
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admins only." }, { status: 403 });
  const db = await getDb();

  const [users, messages, adBookings, purchases] = await Promise.all([
    db.collection("users").find({}, {
      projection: { name: 1, username: 1, age: 1, gender: 1, gold: 1, owned: 1, createdAt: 1 },
    }).sort({ createdAt: -1 }).limit(500).toArray(),
    db.collection("contactMessages").find({}).sort({ createdAt: -1 }).limit(300).toArray(),
    db.collection("adBookings").find({ status: { $in: ["reserved", "active"] } })
      .project({ boardId: 1, date: 1, status: 1, userId: 1, views: 1, clicks: 1 })
      .sort({ createdAt: -1 }).limit(300).toArray(),
    db.collection("purchases").find({}).project({ gold: 1, createdAt: 1 }).toArray().catch(() => []),
  ]);

  const now = Date.now();
  const day = 86400000;
  const totalGold = users.reduce((a, u) => a + (u.gold || 0), 0);
  const newUsers7 = users.filter((u) => u.createdAt && now - new Date(u.createdAt).getTime() < 7 * day).length;
  const revenueCents = (purchases as { gold?: number }[]).length; // count of paid gold packs (sessions)

  const metrics = {
    totalUsers: users.length,
    newUsers7,
    totalGold,
    unread: messages.filter((m) => !m.read).length,
    totalMessages: messages.length,
    activeAds: adBookings.filter((a) => a.status === "active").length,
    reservedAds: adBookings.filter((a) => a.status === "reserved").length,
    goldPacksSold: revenueCents,
    adRevenueUsd: (adBookings.length * 4.99).toFixed(2),
  };

  return NextResponse.json({
    admin: admin.username,
    metrics,
    users: users.map((u) => ({
      id: u._id.toString(), name: u.name, username: u.username, age: u.age, gender: u.gender,
      gold: u.gold || 0, owned: u.owned || [], createdAt: u.createdAt,
    })),
    messages: messages.map((m) => ({
      id: m._id.toString(), name: m.name, email: m.email, subject: m.subject, message: m.message,
      fromUsername: m.fromUsername, read: !!m.read, createdAt: m.createdAt,
    })),
    ads: adBookings.map((a) => ({
      boardId: a.boardId, date: a.date, status: a.status, views: a.views || 0, clicks: a.clicks || 0,
    })),
  });
}
