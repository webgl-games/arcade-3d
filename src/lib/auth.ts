import crypto from "node:crypto";
import { cookies } from "next/headers";
import type { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

export const SESSION_COOKIE = "tp_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface SessionUser {
  id: string;
  name: string;
  username: string;
  age: number;
  gender: string;
}

// Passwords are stored as "salt:hash" using scrypt (no extra dependency needed).
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return (
    candidate.length === expected.length &&
    crypto.timingSafeEqual(candidate, expected)
  );
}

/** Creates a DB-backed session and sets the httpOnly session cookie. */
export async function createSession(userId: ObjectId): Promise<void> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  const db = await getDb();
  await db.collection("sessions").insertOne({ token, userId, expiresAt });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
}

/** Resolves the current session cookie to its user, or null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const db = await getDb();
  const session = await db
    .collection("sessions")
    .findOne({ token, expiresAt: { $gt: new Date() } });
  if (!session) return null;

  const user = await db.collection("users").findOne({ _id: session.userId });
  if (!user) return null;

  return {
    id: user._id.toString(),
    name: user.name,
    username: user.username,
    age: user.age,
    gender: user.gender,
  };
}

/** Deletes the current session (DB row + cookie). */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    const db = await getDb();
    await db.collection("sessions").deleteOne({ token });
  }
  cookieStore.delete(SESSION_COOKIE);
}
