"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Bell, BellRing, Trash2 } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CurrencyIcon } from "@/components/currency-icon";
import { PageContainer } from "@/components/layout/page-container";
import { distanceToTargetPercent } from "@/lib/alerts";
import { deleteAlert } from "@/lib/alerts-store";
import { useAlerts } from "@/lib/use-alerts";
import { computeCrossRate } from "@/lib/exchange-calc";

type TickerItem = { code: string; usdPrice: number };

function formatRate(value: number): string {
  if (value >= 1000) return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (value >= 1) return value.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
  return value.toPrecision(4);
}

export default function AlertsPage() {
  const alerts = useAlerts() ?? [];
  const [usd, setUsd] = useState<Map<string, number> | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/ticker");
        if (!res.ok) return;
        const data = (await res.json()) as { items: TickerItem[] };
        if (!cancelled) setUsd(new Map(data.items.map((i) => [i.code, i.usdPrice])));
      } catch {
        // The list still renders; only the live comparison column is missing.
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function currentRate(give: string, receive: string): number | null {
    const a = usd?.get(give);
    const b = usd?.get(receive);
    return a && b ? computeCrossRate(a, b) : null;
  }

  return (
    <PageContainer className="pb-20 pt-12">
      <Breadcrumbs items={[{ label: "Calculator", href: "/" }, { label: "Rate alerts" }]} />

      <div className="mb-7">
        <h1 className="text-3xl font-semibold tracking-tight">Rate alerts</h1>
        <p className="mt-2 max-w-prose text-sm text-muted">
          Checked in this browser roughly once a minute, while a tab is open. Nothing is
          emailed or pushed — this is a demo, so alerts cannot reach you elsewhere.
        </p>
      </div>

      {alerts.length === 0 ? (
        <div className="surface-card rounded-3xl p-10 text-center">
          <Bell className="mx-auto size-8 text-accent/60" aria-hidden />
          <p className="mt-4 text-sm text-muted">No alerts yet.</p>
          <Link
            href="/rates"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
          >
            Pick a currency to watch
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {alerts.map((alert) => {
            const rate = currentRate(alert.giveCurrency, alert.receiveCurrency);
            const distance = rate ? distanceToTargetPercent(alert, rate) : null;
            const triggered = alert.triggeredAt !== null;

            return (
              <li
                key={alert.id}
                className={`surface-card rounded-2xl p-4 ${triggered ? "" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                      <CurrencyIcon code={alert.giveCurrency} />
                      {alert.giveCurrency}
                      <span className="text-muted">→</span>
                      <CurrencyIcon code={alert.receiveCurrency} />
                      {alert.receiveCurrency}
                    </p>
                    <p className="mt-1.5 text-sm">
                      Notify when {alert.direction}{" "}
                      <span className="font-medium tabular-nums">
                        {formatRate(alert.targetRate)} {alert.receiveCurrency}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {rate ? (
                        <>
                          Now{" "}
                          <span className="tabular-nums">
                            {formatRate(rate)} {alert.receiveCurrency}
                          </span>
                          {distance !== null && !triggered && (
                            <>
                              {" · "}
                              {Math.abs(distance).toFixed(2)}%{" "}
                              {distance > 0 ? "to go" : "past target"}
                            </>
                          )}
                        </>
                      ) : (
                        "Current rate unavailable"
                      )}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
                        triggered
                          ? "border-success/40 bg-success/10 text-success"
                          : "border-border text-muted"
                      }`}
                    >
                      {triggered ? (
                        <>
                          <BellRing className="size-3" aria-hidden />
                          Triggered
                        </>
                      ) : (
                        <>
                          <Bell className="size-3" aria-hidden />
                          Waiting
                        </>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteAlert(alert.id)}
                      className="grid size-8 place-items-center rounded-full border border-border text-muted transition-colors hover:border-danger/50 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                      <span className="sr-only">
                        Delete alert for {alert.giveCurrency} to {alert.receiveCurrency}
                      </span>
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </PageContainer>
  );
}
