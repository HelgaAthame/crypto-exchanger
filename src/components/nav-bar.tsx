"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { useT } from "@/lib/i18n/context";

const LINKS = [
  { href: "/", key: "nav.calculator" },
  { href: "/rates", key: "nav.rates" },
  { href: "/alerts", key: "nav.alerts" },
  { href: "/recurring", key: "nav.recurring" },
  { href: "/history", key: "nav.history" },
];

export function NavBar() {
  const pathname = usePathname();
  const t = useT();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (!panelRef.current?.contains(target) && !burgerRef.current?.contains(target)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        burgerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function linkClass(isCurrent: boolean) {
    return isCurrent ? "bg-accent/10 font-medium text-accent" : "text-muted";
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-shell backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group flex min-w-0 items-center gap-2 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 sm:gap-2.5"
        >
          <Image
            src="/logo/logo-mark.png"
            alt=""
            width={34}
            height={34}
            priority
            className="size-8 shrink-0 transition-transform duration-300 group-hover:scale-105 sm:size-8.5"
          />
          <span className="flex min-w-0 flex-col leading-none">
            <span className="truncate text-sm font-semibold tracking-tight sm:text-base">
              Crypto Exchanger
            </span>
            <span className="hidden text-[10px] uppercase tracking-[0.18em] text-muted sm:block">
              {t("nav.tagline")}
            </span>
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-1">
          {/* Full nav from md up; below that it moves into the panel — five links
              plus the toggles no longer fit beside the logo at sm. */}
          <nav aria-label={t("nav.main")} className="hidden items-center gap-1.5 text-sm md:flex">
            {LINKS.map(({ href, key }) => {
              const isCurrent = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={isCurrent ? "page" : undefined}
                  className={`rounded-full px-3.5 py-2 transition-colors hover:bg-accent/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${linkClass(isCurrent)}`}
                >
                  {t(key)}
                </Link>
              );
            })}
          </nav>

          <LanguageToggle />
          <ThemeToggle />

          <button
            ref={burgerRef}
            type="button"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((o) => !o)}
            className="grid size-9 place-items-center rounded-full border border-border/70 text-muted transition-colors hover:border-accent/50 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 md:hidden"
          >
            {open ? <X className="size-4" aria-hidden /> : <Menu className="size-4" aria-hidden />}
            <span className="sr-only">{open ? t("nav.closeMenu") : t("nav.openMenu")}</span>
          </button>
        </div>
      </div>

      <div
        ref={panelRef}
        id="mobile-nav"
        hidden={!open}
        className="border-t border-border/60 bg-shell backdrop-blur-xl md:hidden"
      >
        <nav aria-label={t("nav.main")} className="flex flex-col gap-1 px-4 py-3">
          {LINKS.map(({ href, key }) => {
            const isCurrent = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={isCurrent ? "page" : undefined}
                // Navigating is the usual way out of the menu.
                onClick={() => setOpen(false)}
                className={`rounded-xl px-3.5 py-2.5 text-sm transition-colors hover:bg-accent/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${linkClass(isCurrent)}`}
              >
                {t(key)}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
