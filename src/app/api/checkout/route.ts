import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getStripe, GOLD_PACKS } from "@/lib/shop";

// Start a Stripe Checkout for a gold pack. Buying gold requires login so the
// purchase can be credited to a permanent account (unlocks last forever).
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json(
      { error: "Log in to buy gold — your purchases save to your account." },
      { status: 401 }
    );

  let body: { pack?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  const packId = typeof body.pack === "string" ? body.pack : "";
  const pack = GOLD_PACKS[packId];
  if (!pack) return NextResponse.json({ error: "Unknown pack." }, { status: 400 });

  const origin = new URL(request.url).origin;
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: pack.cents,
          product_data: { name: `Arcade 3D — ${pack.label}` },
        },
      },
    ],
    // the webhook reads these to credit the right account with the right gold
    client_reference_id: user.id,
    metadata: { userId: user.id, gold: String(pack.gold), pack: packId },
    success_url: `${origin}/?paid=1&gold=${pack.gold}`,
    cancel_url: `${origin}/?paid=0`,
  });

  return NextResponse.json({ url: session.url });
}
