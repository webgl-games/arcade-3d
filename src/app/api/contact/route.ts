import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getSessionUser } from "@/lib/auth";

// Public contact form → stored in `contactMessages` for the admin inbox.
export async function POST(request: Request) {
  let body: { name?: unknown; email?: unknown; subject?: unknown; message?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 80) : "";
  const email = typeof body.email === "string" ? body.email.trim().slice(0, 120) : "";
  const subject = typeof body.subject === "string" ? body.subject.trim().slice(0, 120) : "";
  const message = typeof body.message === "string" ? body.message.trim().slice(0, 4000) : "";

  if (name.length < 2) return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  if (message.length < 5) return NextResponse.json({ error: "Please write a message." }, { status: 400 });

  const user = await getSessionUser(); // attach the account if they're logged in
  const db = await getDb();
  await db.collection("contactMessages").insertOne({
    name, email, subject: subject || "(no subject)", message,
    fromUserId: user?.id || null,
    fromUsername: user?.username || null,
    read: false,
    createdAt: new Date(),
  });
  return NextResponse.json({ ok: true });
}
