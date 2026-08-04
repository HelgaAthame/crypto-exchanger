"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BellRing, X } from "lucide-react";
import { isAlertTriggered, type RateAlert } from "@/lib/alerts";
import { markTriggered } from "@/lib/alerts-store";
import { isOrderFillable } from "@/lib/limit-orders";
import { fillOrders } from "@/lib/limit-orders-store";
import { useAlerts } from "@/lib/use-alerts";
import { useLimitOrders } from "@/lib/use-limit-orders";
import { useT } from "@/lib/i18n/context";
import { computeCrossRate } from "@/lib/exchange-calc";

const POLL_MS = 60_000;

type TickerItem = { code: string; usdPrice: number };

/**
 * Alerts are checked in the browser, on the same 60s cadence the ticker already
 * uses. That means they only fire while a tab is open — stated plainly in the
 * UI rather than dressed up as background delivery, since there is no backend.
 */
export function AlertsWatcher() {
  const t = useT();
  const alerts = useAlerts();
  const orders = useLimitOrders();
  const [fired, setFired] = useState<RateAlert[]>([]);
  const [filled, setFilled] = useState(0);

  const waiting = alerts?.filter((a) => a.triggeredAt === null) ?? [];
  const open = orders?.filter((o) => o.status === "open") ?? [];
  // One key for both, so a single poll covers alerts and orders rather than
  // two timers asking the same endpoint for the same prices.
  const waitingKey = [...waiting.map((a) => a.id), ...open.map((o) => "o:" + o.id)].join(",");

  useEffect(() => {
    if (waitingKey === "") return;

    let cancelled = false;
    async function check() {
      try {
        const res = await fetch("/api/ticker");
        if (!res.ok) return;
        const data = (await res.json()) as { items: TickerItem[] };
        if (cancelled) return;

        const usd = new Map(data.items.map((i) => [i.code, i.usdPrice]));
        const hits: RateAlert[] = [];

        for (const alert of waiting) {
          const give = usd.get(alert.giveCurrency);
          const receive = usd.get(alert.receiveCurrency);
          if (!give || !receive) continue;
          if (isAlertTriggered(alert, computeCrossRate(give, receive))) hits.push(alert);
        }

        if (hits.length > 0) {
          markTriggered(hits.map((a) => a.id));
          setFired((current) => [...current, ...hits]);
        }

        // Limit orders fill at the rate the market is at when the trigger is
        // crossed, not at the target — the price can gap straight past it.
        const fills: { id: string; rate: number }[] = [];
        for (const order of open) {
          const give = usd.get(order.giveCurrency);
          const receive = usd.get(order.receiveCurrency);
          if (!give || !receive) continue;
          const rate = computeCrossRate(give, receive);
          if (isOrderFillable(order, rate)) fills.push({ id: order.id, rate });
        }

        if (fills.length > 0) {
          fillOrders(fills);
          setFilled((count) => count + fills.length);
        }
      } catch {
        // A failed poll just means the next one does the work.
      }
    }

    check();
    const interval = window.setInterval(check, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
    // `waiting` is derived from this key; depending on the array itself would
    // restart the poll on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waitingKey]);

  if (fired.length === 0 && filled === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 z-100 w-[min(24rem,calc(100vw-2rem))] -translate-x-1/2"
    >
      <div className="surface-card rise-in flex items-start gap-3 rounded-2xl p-4">
        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl border border-accent/30 bg-accent/10 text-accent">
          <BellRing className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">
            {fired.length === 0
              ? t("orders.filledMany", { count: filled })
              : fired.length === 1
                ? t("alerts.firedOne")
                : t("alerts.firedMany", { count: fired.length })}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {fired.length > 0
              ? fired
                  .slice(0, 3)
                  .map((a) => `${a.giveCurrency}/${a.receiveCurrency}`)
                  .join(", ")
              : t("orders.filledHint")}
          </p>
          <Link
            href="/alerts"
            onClick={() => {
              setFired([]);
              setFilled(0);
            }}
            className="mt-2 inline-block text-xs font-medium text-accent hover:underline"
          >
            {t("alerts.view")}
          </Link>
        </div>
        <button
          type="button"
          onClick={() => {
            setFired([]);
            setFilled(0);
          }}
          className="grid size-7 shrink-0 place-items-center rounded-full text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          <X className="size-3.5" aria-hidden />
          <span className="sr-only">{t("alerts.dismiss")}</span>
        </button>
      </div>
    </div>
  );
}
