"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

interface Me {
  name: string;
  username: string;
  admin?: boolean;
}

/**
 * Session badge for the landing screen: shows Login/Sign Up links when logged
 * out, and the player's username + Logout when logged in.
 */
export default function AuthCorner() {
  const [user, setUser] = useState<Me | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setUser(d.user ?? null);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
    }
  }

  if (!loaded) return null;

  return (
    <div className="auth-corner">
      {user ? (
        <>
          <span className="auth-corner-user">@{user.username}</span>
          {user.admin && (
            <>
              <span className="auth-corner-sep">|</span>
              <Link href="/admin" style={{ color: "#f4b740" }}>⚙ Admin</Link>
            </>
          )}
          <span className="auth-corner-sep">|</span>
          <Link href="/contact">Contact</Link>
          <span className="auth-corner-sep">|</span>
          <button onClick={handleLogout}>Logout</button>
        </>
      ) : (
        <>
          <Link href="/login">Login</Link>
          <span className="auth-corner-sep">|</span>
          <Link href="/signup">Sign Up</Link>
          <span className="auth-corner-sep">|</span>
          <Link href="/contact">Contact</Link>
        </>
      )}
    </div>
  );
}
