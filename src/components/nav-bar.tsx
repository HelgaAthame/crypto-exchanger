import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export function NavBar() {
  return (
    <header className="w-full border-b border-border">
      <div className="mx-auto max-w-3xl flex items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold tracking-tight">
          RateBridge
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="hover:text-accent">
            Calculator
          </Link>
          <Link href="/history" className="hover:text-accent">
            History
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
