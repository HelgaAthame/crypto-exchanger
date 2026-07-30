import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export function NavBar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-shell backdrop-blur-xl">
      <div className="mx-auto max-w-5xl flex items-center justify-between px-5 py-3">
        <Link href="/" className="flex items-center gap-2.5 group">
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

        <nav className="flex items-center gap-1.5 text-sm">
          <Link
            href="/"
            className="rounded-full px-3.5 py-1.5 text-muted transition-colors hover:bg-accent/10 hover:text-foreground"
          >
            Calculator
          </Link>
          <Link
            href="/history"
            className="rounded-full px-3.5 py-1.5 text-muted transition-colors hover:bg-accent/10 hover:text-foreground"
          >
            History
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
