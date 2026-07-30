"use client";

import { useEffect, useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { CurrencyIcon } from "@/components/currency-icon";

type TickerItem = {
  code: string;
  name: string;
  kind: "fiat" | "crypto";
  usdPrice: number;
  change24h: number | null;
};

const REFRESH_MS = 60_000;

function formatPrice(value: number): string {
  if (value >= 1000) return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (value >= 1) return value.toFixed(2);
  return value.toFixed(4);
}

export function RatesTicker() {
  const [items, setItems] = useState<TickerItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/ticker");
        if (!res.ok) return;
        const data = (await res.json()) as { items: TickerItem[] };
        if (!cancelled) setItems(data.items);
      } catch {
        // A ticker is decorative — a failed refresh keeps the last good values.
      }
    }
    load();
    const interval = window.setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="ticker relative border-b border-border/60 bg-linear-to-r from-transparent via-accent/6 to-transparent py-2.5">
      <div className="ticker-track">
        {[0, 1].map((copy) => (
          <ul
            key={copy}
            className="ticker-list"
            aria-hidden={copy === 1}
            aria-label={copy === 0 ? "Live market prices in US dollars" : undefined}
          >
            {items.map((item) => {
              const up = item.change24h !== null && item.change24h >= 0;
              return (
                <li key={item.code}>
                  <span className="ticker-pill group flex items-center gap-2 whitespace-nowrap rounded-full border border-border/70 bg-card/70 px-3 py-1.5 backdrop-blur-sm">
                    <CurrencyIcon
                      code={item.code}
                      className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[8deg]"
                    />
                    <span className="text-xs font-semibold tracking-wide">{item.code}</span>
                    <span className="text-xs tabular-nums text-muted transition-colors group-hover:text-foreground">
                      ${formatPrice(item.usdPrice)}
                    </span>
                    {item.change24h !== null && (
                      <span
                        className={`flex items-center gap-0.5 text-xs font-medium tabular-nums ${
                          up ? "text-emerald-500" : "text-red-500"
                        }`}
                      >
                        {up ? (
                          <TrendingUp className="size-3" aria-hidden />
                        ) : (
                          <TrendingDown className="size-3" aria-hidden />
                        )}
                        {Math.abs(item.change24h).toFixed(2)}%
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        ))}
      </div>
    </div>
  );
}
