"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogIn, LogOut } from "lucide-react";
import { useT } from "@/lib/i18n/context";

type Me = { user: { id: string; email: string } | null };

/**
 * Shows who is signed in, or a way in.
 *
 * Renders nothing until the first answer arrives: flashing "Sign in" at
 * someone who is already signed in is worse than a beat of empty space.
 */
export function AccountMenu() {
  const t = useT();
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : { user: null }))
      .then((data: Me) => {
        if (!cancelled) setMe(data);
      })
      .catch(() => {
        if (!cancelled) setMe({ user: null });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (me === null) return null;

  if (!me.user) {
    return (
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 rounded-full border border-border/70 px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-accent/50 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        <LogIn className="size-3.5" aria-hidden />
        {t("auth.signIn")}
      </Link>
    );
  }

  return (
    <span className="flex items-center gap-1.5">
      <span
        className="hidden max-w-[10rem] truncate text-xs text-muted lg:block"
        title={me.user.email}
      >
        {me.user.email}
      </span>
      <button
        type="button"
        onClick={async () => {
          await fetch("/api/auth/logout", { method: "POST" });
          // Reload rather than route: the guarded pages are server-rendered
          // against the cookie that has just been cleared.
          window.location.assign("/");
        }}
        className="grid size-9 place-items-center rounded-full border border-border/70 text-muted transition-colors hover:border-accent/50 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        <LogOut className="size-4" aria-hidden />
        <span className="sr-only">{t("auth.signOut")}</span>
      </button>
    </span>
  );
}
