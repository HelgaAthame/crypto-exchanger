"use client";

import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { notFound, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { AlertForm } from "@/components/alert-form";
import { CurrencyIcon } from "@/components/currency-icon";
import { useT } from "@/lib/i18n/context";
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
  const t = useT();
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
          { label: t("nav.calculator"), href: "/" },
          { label: t("rates.title"), href: "/rates" },
          { label: currency.code },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="flex flex-col gap-6">
      <div className="surface-card rise-in rounded-3xl p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <CurrencyIcon code={currency.code} className="size-10 text-base" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{currency.name}</h1>
            <p className="text-sm text-muted">
              {currency.code} · {isCrypto ? t("rates.crypto") : t("rates.fiat")}
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
                  {t("rates.change24h", {
                    sign: up ? "+" : "−",
                    value: Math.abs(self.change24h).toFixed(2),
                  })}
                </p>
              )}
            </>
          ) : (
            <p className="flex items-center gap-2 text-sm text-muted">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              {t("rates.loadingPrice")}
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
            className="gold-surface sheen inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-black shadow-lg shadow-accent/25 transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 active:translate-y-0"
          >
            {isCrypto
              ? t("rates.buy", { code: currency.code })
              : t("rates.exchange", { code: currency.code })}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
          {isCrypto && (
            <Link
              href={`/?mode=sell&give=${currency.code}`}
              className="sheen-border inline-flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-medium transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 active:translate-y-0"
            >
              {t("rates.sell", { code: currency.code })}
            </Link>
          )}
        </div>

      </div>

          <RateChart from={currency.code} to={quote} />
        </div>

        <div className="flex flex-col gap-6">
          <section
            aria-labelledby="alert-heading"
            className="surface-card rounded-3xl p-5 sm:p-6"
          >
            <h2 id="alert-heading" className="text-sm font-semibold">
              {t("rates.watchTitle")}
            </h2>
            <AlertForm
              giveCurrency={currency.code}
              receiveCurrency={quote}
              currentRate={
                self && quoteRow ? computeCrossRate(self.usdPrice, quoteRow.usdPrice) : null
              }
            />
          </section>

      <section aria-labelledby="cross-rates-heading" className="surface-card rounded-3xl p-5 sm:p-6">
        <h2 id="cross-rates-heading" className="text-sm font-semibold">
          {t("rates.crossTitle", { code: currency.code })}
        </h2>

        {rows === null ? (
          <p className="mt-4 flex items-center gap-2 text-sm text-muted">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            {t("common.loading")}
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">
                {t("rates.crossCaption", { name: currency.name })}
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
        </div>
      </div>
    </PageContainer>
  );
}
