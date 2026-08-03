"use client";

import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import Link from "next/link";
import { Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CurrencyIcon } from "@/components/currency-icon";
import { useT } from "@/lib/i18n/context";

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

function Change({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted">—</span>;
  const up = value >= 0;
  return (
    <span className={`inline-flex items-center gap-1 ${up ? "text-success" : "text-danger"}`}>
      {up ? (
        <TrendingUp className="size-3.5" aria-hidden />
      ) : (
        <TrendingDown className="size-3.5" aria-hidden />
      )}
      {up ? "+" : "−"}
      {Math.abs(value).toFixed(2)}%
    </span>
  );
}

export default function RatesPage() {
  const t = useT();
  const [rows, setRows] = useState<RateRow[] | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [error, setError] = useState(false);

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
          setError(false);
        }
      } catch {
        if (!cancelled) setError(true);
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
      <Breadcrumbs items={[{ label: t("nav.calculator"), href: "/" }, { label: t("rates.title") }]} />

      <div className="mb-7">
        <h1 className="text-3xl font-semibold tracking-tight">{t("rates.title")}</h1>
        <p className="mt-2 max-w-prose text-sm text-muted">
          {t("rates.subtitle")}{" "}
          {updatedAt && t("rates.updated", { time: new Date(updatedAt).toLocaleTimeString() })}
        </p>
      </div>

      {error && <p className="mb-4 text-sm text-danger">{t("rates.error")}</p>}

      {rows === null ? (
        <p className="flex items-center justify-center gap-2 py-16 text-sm text-muted">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          {t("rates.loading")}
        </p>
      ) : (
        // No minimum width and no horizontal scroll: below sm the 24h column
        // folds under the price instead of sliding off-screen, where nothing
        // hinted it existed.
        <div className="surface-card rounded-2xl">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">
              {t("rates.caption")}
            </caption>
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wider text-muted">
                <th scope="col" className="px-4 py-3 font-medium">
                  {t("rates.currency")}
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  {t("rates.price")}
                </th>
                <th scope="col" className="hidden px-4 py-3 text-right font-medium sm:table-cell">
                  {t("rates.change")}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
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
                      {/* Same figure, shown inline where the column is hidden. */}
                      <span className="mt-0.5 block sm:hidden">
                        <Change value={row.change24h} />
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-right tabular-nums sm:table-cell">
                      <Change value={row.change24h} />
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-muted">
        {t("rates.footnote")}
      </p>
    </PageContainer>
  );
}
