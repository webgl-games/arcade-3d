import { NextResponse } from "next/server";
import { BOARDS, AD_PRICE_CENTS, availability } from "@/lib/ads";

// Booking page data: the boards + which of the next 14 days are still free.
export async function GET() {
  return NextResponse.json({
    boards: Object.entries(BOARDS).map(([id, b]) => ({ id, name: b.name })),
    priceCents: AD_PRICE_CENTS,
    availability: await availability(),
  });
}
