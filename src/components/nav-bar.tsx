"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

const LINKS = [
  { href: "/", label: "Calculator" },
  { href: "/history", label: "History" },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-shell backdrop-blur-xl">
      <div className="mx-auto max-w-5xl flex items-center justify-between px-5 py-3">
        <Link
          href="/"
          className="group flex items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          <Image
            src="/logo/logo-mark.png"
            alt=""
            width={34}
            height={34}
            priority
            className="transition-transform duration-300 group-hover:scale-105"
          />
          <span className="flex flex-col leading-none">
            <span className="text-base font-semibold tracking-tight">Crypto Exchanger</span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted">
              live rates · demo
            </span>
          </span>
        </Link>

        <nav aria-label="Main" className="flex items-center gap-1.5 text-sm">
          {LINKS.map(({ href, label }) => {
            const isCurrent = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={isCurrent ? "page" : undefined}
                className={`rounded-full px-3.5 py-2 transition-colors hover:bg-accent/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
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
