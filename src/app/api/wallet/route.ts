import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getWallet } from "@/lib/wallet";
import { ITEMS } from "@/lib/shop";
import { isAdmin } from "@/lib/admin";

// The game fetches this on load. Guests get {loggedIn:false} and fall back to
// local (device-only) progress; logged-in users get their persisted wallet.
// ADMINS get every item unlocked and a huge gold balance automatically.
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ loggedIn: false });
  const wallet = await getWallet(user.id);
  if (isAdmin(user.username)) {
    return NextResponse.json({
      loggedIn: true,
      username: user.username,
      admin: true,
      gold: Math.max(wallet.gold, 9_999_999),
      owned: Object.keys(ITEMS), // full inventory access
    });
  }
  return NextResponse.json({ loggedIn: true, username: user.username, ...wallet });
}
