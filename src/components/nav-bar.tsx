"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const LINKS = [
  { href: "/", label: "Calculator" },
  { href: "/rates", label: "Rates" },
  { href: "/history", label: "History" },
];

export function NavBar() {
  const pathname = usePathname();
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
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-3 sm:px-5">
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
              live rates · demo
            </span>
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-1">
          {/* Full nav from sm up; below that it moves into the panel. */}
          <nav aria-label="Main" className="hidden items-center gap-1.5 text-sm sm:flex">
            {LINKS.map(({ href, label }) => {
              const isCurrent = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={isCurrent ? "page" : undefined}
                  className={`rounded-full px-3.5 py-2 transition-colors hover:bg-accent/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${linkClass(isCurrent)}`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <ThemeToggle />

          <button
            ref={burgerRef}
            type="button"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((o) => !o)}
            className="grid size-9 place-items-center rounded-full border border-border/70 text-muted transition-colors hover:border-accent/50 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 sm:hidden"
          >
            {open ? <X className="size-4" aria-hidden /> : <Menu className="size-4" aria-hidden />}
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          </button>
        </div>
      </div>

      <div
        ref={panelRef}
        id="mobile-nav"
        hidden={!open}
        className="border-t border-border/60 bg-shell backdrop-blur-xl sm:hidden"
      >
        <nav aria-label="Main" className="flex flex-col gap-1 px-4 py-3">
          {LINKS.map(({ href, label }) => {
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
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
