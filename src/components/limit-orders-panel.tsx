"use client";

import { useState } from "react";
import { CircleDot, ShieldAlert, Trash2, TrendingDown, TrendingUp, X } from "lucide-react";
import { CurrencyIcon } from "@/components/currency-icon";
import { CurrencySelect } from "@/components/currency-select";
import { CRYPTO_CURRENCIES, FIAT_CURRENCIES, isSupportedCurrency } from "@/lib/currencies";
import { useT } from "@/lib/i18n/context";
import { DEFAULT_FEE_PERCENT } from "@/lib/limits";
import {
  directionForTarget,
  distanceToTargetPercent,
  fillAmount,
  validateLimitOrder,
} from "@/lib/limit-orders";
import { cancelOrder, createOrder, deleteOrder } from "@/lib/limit-orders-store";
import { useLimitOrders } from "@/lib/use-limit-orders";

function formatRate(value: number): string {
  if (value >= 1000) return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (value >= 1) return value.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
  return value.toPrecision(4);
}

export function LimitOrdersPanel({
  currentRate,
}: {
  /** Looks up the live rate for a pair, or null while prices are loading. */
  currentRate: (give: string, receive: string) => number | null;
}) {
  const t = useT();
  const orders = useLimitOrders() ?? [];

  const [giveCurrency, setGiveCurrency] = useState("USD");
  const [receiveCurrency, setReceiveCurrency] = useState("BTC");
  const [amount, setAmount] = useState("500");
  const [target, setTarget] = useState("");
  const [error, setError] = useState<
    { key: string; params?: Record<string, string | number> } | null
  >(null);

  const rate = currentRate(giveCurrency, receiveCurrency);

  function submit() {
    setError(null);
    if (!rate) return;

    const result = validateLimitOrder({
      giveAmount: Number(amount),
      targetRate: Number(target),
      currentRate: rate,
      giveCurrency,
      receiveCurrency,
      isCurrencySupported: isSupportedCurrency,
    });
    if (!result.valid) {
      const issue = result.issues[0];
      setError({ key: `validation.${issue.code}`, params: issue.params });
      return;
    }

    createOrder({
      giveCurrency,
      receiveCurrency,
      giveAmount: Number(amount),
      targetRate: Number(target),
      direction: directionForTarget(Number(target), rate),
      rateAtCreation: rate,
    });
    setTarget("");
  }

  return (
    <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
      <section aria-labelledby="orders-heading">
        <h2 id="orders-heading" className="text-2xl font-semibold tracking-tight">
          {t("orders.title")}
        </h2>
        <p className="mt-2 max-w-prose text-sm text-muted">{t("orders.subtitle")}</p>

        {orders.length === 0 ? (
          <div className="surface-card mt-6 rounded-3xl p-10 text-center">
            <CircleDot className="mx-auto size-8 text-accent/60" aria-hidden />
            <p className="mt-4 text-sm text-muted">{t("orders.empty")}</p>
          </div>
        ) : (
          <ul className="mt-6 flex flex-col gap-3">
            {orders.map((order) => {
              const live = currentRate(order.giveCurrency, order.receiveCurrency);
              const gap = live ? distanceToTargetPercent(order, live) : null;
              const isOpen = order.status === "open";
              const fill =
                order.filledRate === null
                  ? null
                  : fillAmount(order.giveAmount, order.filledRate, DEFAULT_FEE_PERCENT);

              return (
                <li
                  key={order.id}
                  className={`surface-card rounded-2xl p-4 ${isOpen ? "" : "opacity-80"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                        <CurrencyIcon code={order.giveCurrency} />
                        {formatRate(order.giveAmount)} {order.giveCurrency}
                        <span className="text-muted">→</span>
                        <CurrencyIcon code={order.receiveCurrency} />
                        {order.receiveCurrency}
                      </p>

                      <p className="mt-1.5 flex items-center gap-1.5 text-sm">
                        {order.direction === "above" ? (
                          <TrendingUp className="size-3.5 text-muted" aria-hidden />
                        ) : (
                          <TrendingDown className="size-3.5 text-muted" aria-hidden />
                        )}
                        {order.status === "filled" && order.filledRate !== null
                          ? t("orders.filledAt", {
                              rate: formatRate(order.filledRate),
                              code: order.receiveCurrency,
                            })
                          : t("orders.target", {
                              rate: formatRate(order.targetRate),
                              code: order.receiveCurrency,
                            })}
                      </p>

                      {fill && (
                        <p className="mt-1 text-xs text-muted">
                          {t("orders.receives", {
                            amount: formatRate(fill.receiveAmount),
                            code: order.receiveCurrency,
                          })}
                        </p>
                      )}

                      {isOpen && gap !== null && (
                        <p className="mt-1 text-xs text-muted">
                          {t("orders.gap", { value: Math.abs(gap).toFixed(2) })}
                          {" · "}
                          {order.direction === "above"
                            ? t("orders.waitingRise")
                            : t("orders.waitingFall")}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
                          order.status === "filled"
                            ? "border-success/40 bg-success/10 text-success"
                            : isOpen
                              ? "border-accent/40 bg-accent/10 text-accent"
                              : "border-border text-muted"
                        }`}
                      >
                        {t(`orders.${order.status}`)}
                      </span>

                      {isOpen && (
                        <button
                          type="button"
                          onClick={() => cancelOrder(order.id)}
                          className="grid size-8 place-items-center rounded-full border border-border text-muted transition-colors hover:border-accent/50 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                        >
                          <X className="size-3.5" aria-hidden />
                          <span className="sr-only">{t("orders.cancel")}</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteOrder(order.id)}
                        className="grid size-8 place-items-center rounded-full border border-border text-muted transition-colors hover:border-danger/50 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                        <span className="sr-only">
                          {t("orders.delete", {
                            from: order.giveCurrency,
                            to: order.receiveCurrency,
                          })}
                        </span>
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section
        aria-labelledby="new-order-heading"
        className="surface-card rounded-3xl p-5 sm:p-6 lg:sticky lg:top-24"
      >
        <h2 id="new-order-heading" className="text-sm font-semibold">
          {t("orders.newTitle")}
        </h2>

        <div className="mt-4 flex flex-col gap-3.5">
          <CurrencySelect
            label={t("orders.spend")}
            value={giveCurrency}
            onChange={setGiveCurrency}
            options={FIAT_CURRENCIES}
          />

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
              {t("calc.amount")}
            </span>
            <input
              type="number"
              min={0}
              inputMode="decimal"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError(null);
              }}
              className="w-full rounded-xl border border-control-border bg-background px-4 py-2.5 text-sm tabular-nums transition-colors hover:border-accent/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
            />
          </label>

          <CurrencySelect
            label={t("orders.buy")}
            value={receiveCurrency}
            onChange={setReceiveCurrency}
            options={CRYPTO_CURRENCIES}
          />

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
              {t("orders.whenRate", { code: giveCurrency })}
            </span>
            <input
              type="number"
              min={0}
              inputMode="decimal"
              value={target}
              onChange={(e) => {
                setTarget(e.target.value);
                setError(null);
              }}
              placeholder={rate ? formatRate(rate) : "0"}
              aria-invalid={error ? true : undefined}
              className="w-full rounded-xl border border-control-border bg-background px-4 py-2.5 text-sm tabular-nums transition-colors hover:border-accent/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
            />
          </label>

          {error ? (
            <p role="alert" className="text-xs text-danger">
              {t(error.key, error.params)}
            </p>
          ) : (
            <p className="text-xs text-muted">
              {t("alerts.current", {
                rate: rate ? formatRate(rate) : "—",
                code: receiveCurrency,
              })}
            </p>
          )}

          <button
            type="button"
            onClick={submit}
            disabled={!rate || Number(target) <= 0}
            className="gold-surface sheen mt-1 w-full rounded-xl py-3 text-sm font-semibold text-black shadow-lg shadow-accent/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 active:translate-y-0 disabled:pointer-events-none disabled:opacity-45"
          >
            {t("orders.place")}
          </button>

          <p className="flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
            <ShieldAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            {t("orders.notice")}
          </p>
        </div>
      </section>
    </div>
  );
}
