import Stripe from "stripe";

// One Stripe client per process. The secret key is server-only (never shipped to
// the browser); it comes from .env.local locally and the server environment in production.
let _stripe: Stripe | null = null;
export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("Missing STRIPE_SECRET_KEY");
    _stripe = new Stripe(key);
  }
  return _stripe;
}

// Gold packs bought with a real card. amount = gold credited on payment.
export const GOLD_PACKS: Record<string, { gold: number; cents: number; label: string }> = {
  pack_small:  { gold: 500,   cents: 199,  label: "500 Gold" },
  pack_medium: { gold: 1500,  cents: 499,  label: "1,500 Gold" },
  pack_large:  { gold: 4000,  cents: 999,  label: "4,000 Gold" },
  pack_mega:   { gold: 10000, cents: 1999, label: "10,000 Gold" },
};

// Unlockable items — prices MUST match the in-game store (tiny-planet.html STORE_ITEMS).
// Buying spends gold (server-authoritative) and adds the id to the account's owned[].
export const ITEMS: Record<string, { price: number; label: string }> = {
  cape:   { price: 300, label: "🦸 Hero Red Cape" },
  flyveh: { price: 500, label: "🚗 Flying Vehicle" },
  gun:    { price: 400, label: "🔫 Blaster Gun" },
  craft:  { price: 800, label: "🛸 Starfighter" },
};
