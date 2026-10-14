import { getSessionUser, SessionUser } from "@/lib/auth";

// Admins get every item unlocked in-game AND access to /admin (user + message
// management, metrics). Set ADMIN_USERNAMES to a comma-separated list of
// usernames (compared lowercase — usernames are normalised at signup). Empty by
// default: nobody is an admin until you name someone.
export const ADMIN_USERNAMES = (process.env.ADMIN_USERNAMES || "")
  .split(",")
  .map((name) => name.trim().toLowerCase())
  .filter(Boolean);

export function isAdmin(username?: string | null): boolean {
  return !!username && ADMIN_USERNAMES.includes(username.toLowerCase());
}

/** Returns the session user only if they're an admin, else null (for route guards). */
export async function requireAdmin(): Promise<SessionUser | null> {
  const user = await getSessionUser();
  return user && isAdmin(user.username) ? user : null;
}
