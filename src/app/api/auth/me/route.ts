import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";

export async function GET() {
  const user = await getSessionUser();
  return NextResponse.json({
    user: user ? { ...user, admin: isAdmin(user.username) } : null,
  });
}
