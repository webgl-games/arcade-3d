import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { ITEMS } from "@/lib/shop";

export interface Wallet {
  gold: number;
  owned: string[];
}

/** The account's current gold + unlocked items (defaults for a fresh account). */
export async function getWallet(userId: string): Promise<Wallet> {
  const db = await getDb();
  const u = await db
    .collection("users")
    .findOne({ _id: new ObjectId(userId) }, { projection: { gold: 1, owned: 1 } });
  return { gold: u?.gold ?? 0, owned: u?.owned ?? [] };
}

/** Credit gold (earned in-game or bought). `amount` may be clamped by the caller. */
export async function addGold(userId: string, amount: number): Promise<Wallet> {
  const db = await getDb();
  const r = await db
    .collection("users")
    .findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $inc: { gold: Math.max(0, Math.floor(amount)) } },
      { returnDocument: "after", projection: { gold: 1, owned: 1 } }
    );
  return { gold: r?.gold ?? 0, owned: r?.owned ?? [] };
}

/**
 * Server-authoritative purchase: verifies the price against the catalog and the
 * account's balance, deducts gold, and records the unlock. Idempotent — buying
 * something already owned just returns the wallet unchanged.
 */
export async function buyItem(
  userId: string,
  itemId: string
): Promise<{ ok: boolean; error?: string; wallet: Wallet }> {
  const item = ITEMS[itemId];
  const wallet = await getWallet(userId);
  if (!item) return { ok: false, error: "Unknown item.", wallet };
  if (wallet.owned.includes(itemId)) return { ok: true, wallet }; // already owned
  if (wallet.gold < item.price)
    return { ok: false, error: "Not enough gold.", wallet };

  const db = await getDb();
  // atomic guard: only succeeds if the balance still covers it and it isn't owned
  const r = await db.collection("users").findOneAndUpdate(
    { _id: new ObjectId(userId), gold: { $gte: item.price }, owned: { $ne: itemId } },
    { $inc: { gold: -item.price }, $addToSet: { owned: itemId } },
    { returnDocument: "after", projection: { gold: 1, owned: 1 } }
  );
  if (!r) return { ok: false, error: "Purchase failed — try again.", wallet };
  return { ok: true, wallet: { gold: r.gold ?? 0, owned: r.owned ?? [] } };
}

/** Stripe webhook grants gold on paid purchase, keyed by session id (idempotent). */
export async function creditPurchase(
  userId: string,
  gold: number,
  stripeSessionId: string
): Promise<void> {
  const db = await getDb();
  // record the session once; if we've seen it, do nothing (webhooks can retry)
  const already = await db
    .collection("purchases")
    .findOne({ sessionId: stripeSessionId });
  if (already) return;
  await db
    .collection("purchases")
    .insertOne({ sessionId: stripeSessionId, userId, gold, at: new Date() });
  await addGold(userId, gold);
}
