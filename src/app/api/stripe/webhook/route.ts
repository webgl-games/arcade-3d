import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/shop";
import { creditPurchase } from "@/lib/wallet";
import { activateBooking } from "@/lib/ads";

// Stripe calls this after a successful payment. It's the SOURCE OF TRUTH for
// crediting gold — the browser success redirect is only cosmetic. The signature
// is verified against STRIPE_WEBHOOK_SECRET so nobody can fake a payment.
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "not configured" }, { status: 500 });

  const sig = request.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "no signature" }, { status: 400 });

  const raw = await request.text(); // raw body required for signature verification
  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    return NextResponse.json(
      { error: `signature failed: ${(err as Error).message}` },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const s = event.data.object as Stripe.Checkout.Session;
    if (s.payment_status === "paid") {
      if (s.metadata?.kind === "ad" && s.metadata.bookingId) {
        // billboard booking → every paid day goes live (multi-day = comma-joined ids)
        for (const id of s.metadata.bookingId.split(",")) await activateBooking(id.trim(), s.id);
      } else {
        // gold pack → credit the account
        const userId = s.metadata?.userId || (s.client_reference_id ?? "");
        const gold = Number(s.metadata?.gold || 0);
        if (userId && gold > 0) await creditPurchase(userId, gold, s.id);
      }
    }
  }

  return NextResponse.json({ received: true });
}
