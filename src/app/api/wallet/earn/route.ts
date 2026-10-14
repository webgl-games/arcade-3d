import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { addGold } from "@/lib/wallet";

// The game reports gold earned from gameplay (deliveries, car wrecks, demolition).
// Clamp per-call so a tampered client can't mint a fortune in one request.
const MAX_PER_CALL = 500;

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ loggedIn: false }, { status: 401 });
  let body: { amount?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  const amount = Math.min(MAX_PER_CALL, Math.max(0, Math.floor(Number(body.amount) || 0)));
  if (amount <= 0) return NextResponse.json({ error: "Nothing to add." }, { status: 400 });
  const wallet = await addGold(user.id, amount);
  return NextResponse.json({ loggedIn: true, ...wallet });
}
