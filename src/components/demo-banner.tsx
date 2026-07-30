import { Info } from "lucide-react";

export function DemoBanner() {
  return (
    <div className="w-full border-b border-accent/20 bg-linear-to-r from-transparent via-accent/10 to-transparent">
      <p className="mx-auto flex max-w-5xl items-center justify-center gap-2 px-4 py-2 text-center text-xs sm:px-5 sm:text-sm">
        <Info className="size-3.5 shrink-0 text-accent" aria-hidden />
        <span>
          <span className="font-semibold text-accent">Demo project</span> — no real funds are
          transferred. Rates are live, exchange requests are simulated.
        </span>
      </p>
    </div>
  );
}
