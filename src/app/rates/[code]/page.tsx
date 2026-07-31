"use client";

import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { notFound, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { AlertForm } from "@/components/alert-form";
import { CurrencyIcon } from "@/components/currency-icon";
import { RateChart } from "@/components/rate-chart";
import { ALL_CURRENCIES, getCurrency } from "@/lib/currencies";
import { computeCrossRate } from "@/lib/exchange-calc";

type RateRow = {
  code: string;
  usdPrice: number;
  change24h: number | null;
};

function formatPrice(value: number): string {
  if (value >= 1000) return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (value >= 1) return value.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
  return value.toPrecision(4);
}

export default function CurrencyDetailPage() {
  const params = useParams<{ code: string }>();
  const code = params.code?.toUpperCase();
  const currency = code ? getCurrency(code) : undefined;

  const [rows, setRows] = useState<RateRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/ticker");
        if (!res.ok) return;
        const data = (await res.json()) as { items: RateRow[] };
        if (!cancelled) setRows(data.items);
      } catch {
        // The chart below still works; the hero simply stays in its loading state.
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!currency) notFound();

  const self = rows?.find((r) => r.code === currency.code);
  const up = self?.change24h !== null && self?.change24h !== undefined && self.change24h >= 0;
  // USD is the bridge, so it has no USD price of its own to chart against.
  const quote = currency.code === "USD" ? "EUR" : "USD";
  const isCrypto = currency.kind === "crypto";
  const quoteRow = rows?.find((r) => r.code === quote);

  return (
    <PageContainer className="pb-20 pt-10">
      <Breadcrumbs
        items={[
          { label: "Calculator", href: "/" },
          { label: "Live rates", href: "/rates" },
          { label: currency.code },
        ]}
      />

      <div className="surface-card rise-in rounded-3xl p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <CurrencyIcon code={currency.code} className="size-10 text-base" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{currency.name}</h1>
            <p className="text-sm text-muted">
              {currency.code} · {isCrypto ? "Cryptocurrency" : "Fiat currency"}
            </p>
          </div>
        </div>

        <div className="mt-6">
          {self ? (
            <>
              {/* Proportional figures: tabular-nums reads loose at display size. */}
              <p className="text-4xl font-semibold">
                <span className="gold-text">${formatPrice(self.usdPrice)}</span>
              </p>
              {self.change24h !== null && (
                <p
                  className={`mt-1.5 flex items-center gap-1 text-sm font-medium ${
                    up ? "text-success" : "text-danger"
                  }`}
                >
                  {up ? (
                    <TrendingUp className="size-4" aria-hidden />
                  ) : (
                    <TrendingDown className="size-4" aria-hidden />
                  )}
                  {up ? "+" : "−"}
                  {Math.abs(self.change24h).toFixed(2)}% in the last 24 hours
                </p>
              )}
            </>
          ) : (
            <p className="flex items-center gap-2 text-sm text-muted">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Loading price…
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-2.5">
          <Link
            href={
              isCrypto
                ? `/?mode=buy&receive=${currency.code}`
                : `/?mode=exchange&give=${currency.code}`
            }
            className="gold-surface inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-black shadow-lg shadow-accent/25 transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 active:translate-y-0"
          >
            {isCrypto ? `Buy ${currency.code}` : `Exchange ${currency.code}`}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
          {isCrypto && (
            <Link
              href={`/?mode=sell&give=${currency.code}`}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-medium transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 active:translate-y-0"
            >
              Sell {currency.code}
            </Link>
          )}
        </div>

        <AlertForm
          giveCurrency={currency.code}
          receiveCurrency={quote}
          currentRate={
            self && quoteRow ? computeCrossRate(self.usdPrice, quoteRow.usdPrice) : null
          }
        />
      </div>

      <RateChart from={currency.code} to={quote} />

      <section aria-labelledby="cross-rates-heading" className="surface-card mt-6 rounded-3xl p-5 sm:p-6">
        <h2 id="cross-rates-heading" className="text-sm font-semibold">
          1 {currency.code} in other currencies
        </h2>

        {rows === null ? (
          <p className="mt-4 flex items-center gap-2 text-sm text-muted">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Loading…
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">
                Value of one {currency.name} in each other supported currency
              </caption>
              <tbody>
                {ALL_CURRENCIES.filter((c) => c.code !== currency.code).map((other) => {
                  const from = rows.find((r) => r.code === currency.code)?.usdPrice;
                  const to = rows.find((r) => r.code === other.code)?.usdPrice;
                  const rate = from && to ? computeCrossRate(from, to) : 0;
                  return (
                    <tr key={other.code} className="border-b border-border/50 last:border-0">
                      <th scope="row" className="py-2.5 pr-3 font-normal">
                        <Link
                          href={`/rates/${other.code}`}
                          className="flex items-center gap-2.5 rounded transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                        >
                          <CurrencyIcon code={other.code} />
                          <span className="font-medium">{other.code}</span>
                          <span className="hidden text-muted sm:inline">{other.name}</span>
                        </Link>
                      </th>
                      <td className="py-2.5 text-right tabular-nums">
                        {rate ? formatPrice(rate) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </PageContainer>
  );
}
