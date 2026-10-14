import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { buyItem } from "@/lib/wallet";

// Spend gold to unlock an item — the price and balance are checked server-side,
// so the unlock is permanent and can't be forged by editing the client.
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ loggedIn: false }, { status: 401 });
  let body: { id?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  const id = typeof body.id === "string" ? body.id : "";
  const result = await buyItem(user.id, id);
  return NextResponse.json(
    { loggedIn: true, ok: result.ok, error: result.error, ...result.wallet },
    { status: result.ok ? 200 : 400 }
  );
}
