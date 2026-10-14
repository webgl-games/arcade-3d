import { NextResponse } from "next/server";
import { getDb, ensureIndexes } from "@/lib/mongodb";
import { hashPassword, createSession } from "@/lib/auth";

const GENDERS = ["male", "female"];

function bad(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return bad("Invalid request body.");
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const age = Number(body.age);
  const gender = typeof body.gender === "string" ? body.gender : "";
  const username =
    typeof body.username === "string" ? body.username.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const confirmPassword =
    typeof body.confirmPassword === "string" ? body.confirmPassword : "";

  if (name.length < 2 || name.length > 50)
    return bad("Name must be 2–50 characters.");
  if (!Number.isInteger(age) || age < 5 || age > 120)
    return bad("Enter a valid age (5–120).");
  if (!GENDERS.includes(gender)) return bad("Select a gender.");
  if (!/^[a-z0-9_]{3,20}$/.test(username))
    return bad("Username must be 3–20 characters: letters, numbers, underscores.");
  if (password.length < 8)
    return bad("Password must be at least 8 characters.");
  if (password !== confirmPassword) return bad("Passwords do not match.");

  const db = await getDb();
  await ensureIndexes(db);

  try {
    const result = await db.collection("users").insertOne({
      name,
      age,
      gender,
      username,
      passwordHash: hashPassword(password),
      createdAt: new Date(),
    });
    await createSession(result.insertedId);
    return NextResponse.json(
      { user: { id: result.insertedId.toString(), name, username } },
      { status: 201 }
    );
  } catch (e) {
    // E11000: unique index on username — someone got there first.
    if (e && typeof e === "object" && "code" in e && e.code === 11000) {
      return bad("That username is already taken.", 409);
    }
    throw e;
  }
}
