"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

const LINKS = [
  { href: "/", label: "Calculator" },
  { href: "/rates", label: "Rates" },
  { href: "/history", label: "History" },
];

export function NavBar() {
  const pathname = usePathname();

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
            {/* Drops out below sm, where the row needs every pixel for the nav. */}
            <span className="hidden text-[10px] uppercase tracking-[0.18em] text-muted sm:block">
              live rates · demo
            </span>
          </span>
        </Link>

        <nav aria-label="Main" className="flex shrink-0 items-center gap-0.5 text-sm sm:gap-1.5">
          {LINKS.map(({ href, label }) => {
            const isCurrent = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={isCurrent ? "page" : undefined}
                className={`rounded-full px-2.5 py-2 transition-colors hover:bg-accent/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 sm:px-3.5 ${
                  isCurrent ? "bg-accent/10 font-medium text-accent" : "text-muted"
                }`}
              >
                {label}
              </Link>
            );
          })}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
