import { NextResponse } from "next/server";
import { BOARDS, activeAd } from "@/lib/ads";

// The game polls this: what should each billboard show today?
// ?board=b1 for one board, or no param for all three at once.
export async function GET(request: Request) {
  const board = new URL(request.url).searchParams.get("board");
  try {
    if (board) {
      if (!BOARDS[board]) return NextResponse.json({ error: "Unknown board." }, { status: 400 });
      return NextResponse.json({ media: await activeAd(board) });
    }
    const out: Record<string, unknown> = {};
    for (const id of Object.keys(BOARDS)) out[id] = await activeAd(id);
    return NextResponse.json({ boards: out });
  } catch {
    // DB down → the game just shows its default promo screens
    return NextResponse.json({ boards: {} });
  }
}
