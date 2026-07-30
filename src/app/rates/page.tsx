"use client";

import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import Link from "next/link";
import { Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CurrencyIcon } from "@/components/currency-icon";

type RateRow = {
  code: string;
  name: string;
  kind: "fiat" | "crypto";
  usdPrice: number;
  change24h: number | null;
};

const REFRESH_MS = 60_000;

function formatPrice(value: number): string {
  if (value >= 1000) return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (value >= 1) return value.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
  return value.toPrecision(4);
}

export default function RatesPage() {
  const [rows, setRows] = useState<RateRow[] | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/ticker");
        if (!res.ok) throw new Error("failed");
        const data = (await res.json()) as { items: RateRow[]; updatedAt: string };
        if (!cancelled) {
          setRows(data.items);
          setUpdatedAt(data.updatedAt);
          setError(null);
        }
      } catch {
        if (!cancelled) setError("Could not load rates. They will refresh shortly.");
      }
    }
    load();
    const interval = window.setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <PageContainer className="pb-20 pt-12">
      <Breadcrumbs items={[{ label: "Calculator", href: "/" }, { label: "Live rates" }]} />

      <div className="mb-7">
        <h1 className="text-3xl font-semibold tracking-tight">Live rates</h1>
        <p className="mt-2 text-sm text-muted">
          US dollar price and 24-hour change for every currency this demo supports.
          {updatedAt && ` Updated ${new Date(updatedAt).toLocaleTimeString()}.`}
        </p>
      </div>

      {error && <p className="mb-4 text-sm text-danger">{error}</p>}

      {rows === null ? (
        <p className="flex items-center justify-center gap-2 py-16 text-sm text-muted">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Loading rates…
        </p>
      ) : (
        <div className="surface-card overflow-x-auto rounded-2xl">
          <table className="w-full min-w-md text-left text-sm">
            <caption className="sr-only">
              Supported currencies with their US dollar price and 24-hour change
            </caption>
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wider text-muted">
                <th scope="col" className="px-4 py-3 font-medium">
                  Currency
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  Price (USD)
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  24h
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const up = row.change24h !== null && row.change24h >= 0;
                return (
                  <tr key={row.code} className="border-b border-border/50 last:border-0">
                    <th scope="row" className="px-4 py-3 font-normal">
                      <Link
                        href={`/rates/${row.code}`}
                        className="flex items-center gap-2.5 rounded transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                      >
                        <CurrencyIcon code={row.code} />
                        <span className="flex flex-col sm:flex-row sm:gap-2">
                          <span className="font-medium">{row.code}</span>
                          <span className="text-xs text-muted sm:text-sm">{row.name}</span>
                        </span>
                      </Link>
                    </th>
                    <td className="px-4 py-3 text-right tabular-nums">
                      ${formatPrice(row.usdPrice)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {row.change24h === null ? (
                        <span className="text-muted">—</span>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1 ${
                            up ? "text-success" : "text-danger"
                          }`}
                        >
                          {up ? (
                            <TrendingUp className="size-3.5" aria-hidden />
                          ) : (
                            <TrendingDown className="size-3.5" aria-hidden />
                          )}
                          {up ? "+" : "−"}
                          {Math.abs(row.change24h).toFixed(2)}%
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-muted">
        Crypto prices come from CoinGecko, fiat from Frankfurter. Fiat pairs have no
        24-hour figure because the source publishes one rate per business day.
      </p>
    </PageContainer>
  );
}
