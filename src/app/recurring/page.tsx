"use client";

import { useState } from "react";
import { CalendarClock, Pause, Play, Repeat, ShieldAlert, Trash2 } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CurrencyIcon } from "@/components/currency-icon";
import { CurrencySelect } from "@/components/currency-select";
import { PageContainer } from "@/components/layout/page-container";
import { CRYPTO_CURRENCIES, FIAT_CURRENCIES, isSupportedCurrency } from "@/lib/currencies";
import { useT } from "@/lib/i18n/context";
import {
  CADENCE_DAYS,
  daysUntilNextRun,
  nextRunAt,
  projectedSpend,
  validateRecurringPlan,
  type Cadence,
} from "@/lib/recurring";
import { createPlan, deletePlan, togglePlan } from "@/lib/recurring-store";
import { useRecurringPlans } from "@/lib/use-recurring";

const CADENCES = Object.keys(CADENCE_DAYS) as Cadence[];

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatAmount(value: number): string {
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export default function RecurringPage() {
  const t = useT();
  const plans = useRecurringPlans() ?? [];

  const [giveCurrency, setGiveCurrency] = useState("USD");
  const [receiveCurrency, setReceiveCurrency] = useState("BTC");
  const [amount, setAmount] = useState("100");
  const [cadence, setCadence] = useState<Cadence>("weekly");
  const [startsAt, setStartsAt] = useState(today());
  const [error, setError] = useState<
    { key: string; params?: Record<string, string | number> } | null
  >(null);

  function submit() {
    setError(null);
    const start = `${startsAt}T00:00:00.000Z`;
    const result = validateRecurringPlan({
      amount: Number(amount),
      giveCurrency,
      receiveCurrency,
      startsAt: start,
      isCurrencySupported: isSupportedCurrency,
    });
    if (!result.valid) {
      const issue = result.issues[0];
      setError({ key: `validation.${issue.code}`, params: issue.params });
      return;
    }

    createPlan({
      giveCurrency,
      receiveCurrency,
      amount: Number(amount),
      cadence,
      startsAt: start,
    });
  }

  const now = new Date();

  return (
    <PageContainer className="pb-20 pt-12">
      <Breadcrumbs
        items={[{ label: t("nav.calculator"), href: "/" }, { label: t("recurring.title") }]}
      />

      <div className="mb-7">
        <h1 className="text-3xl font-semibold tracking-tight">{t("recurring.title")}</h1>
        <p className="mt-2 max-w-prose text-sm text-muted">{t("recurring.subtitle")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div>
          {plans.length === 0 ? (
            <div className="surface-card rounded-3xl p-10 text-center">
              <Repeat className="mx-auto size-8 text-accent/60" aria-hidden />
              <p className="mt-4 text-sm text-muted">{t("recurring.empty")}</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {plans.map((plan) => {
                const next = nextRunAt(plan, now);
                const days = daysUntilNextRun(plan, now);
                const projected = projectedSpend(plan, now, 90);

                return (
                  <li
                    key={plan.id}
                    className={`surface-card rounded-2xl p-4 ${plan.paused ? "opacity-70" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                          <CurrencyIcon code={plan.giveCurrency} />
                          {plan.giveCurrency}
                          <span className="text-muted">→</span>
                          <CurrencyIcon code={plan.receiveCurrency} />
                          {plan.receiveCurrency}
                        </p>

                        <p className="mt-1.5 text-sm">
                          {t("recurring.summary", {
                            amount: `${formatAmount(plan.amount)}`,
                            code: plan.giveCurrency,
                            cadence: t(`recurring.cadence.${plan.cadence}`),
                          })}
                        </p>

                        {!plan.paused && next && (
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                            <CalendarClock className="size-3" aria-hidden />
                            {t("recurring.nextRun", {
                              date: next.toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              }),
                            })}
                            {days !== null && (
                              <>
                                {" · "}
                                {days === 0
                                  ? t("recurring.dueToday")
                                  : days === 1
                                    ? t("recurring.tomorrow")
                                    : t("recurring.inDays", { days })}
                              </>
                            )}
                          </p>
                        )}

                        <p className="mt-1 text-xs text-muted">
                          {t("recurring.projected", {
                            amount: formatAmount(projected),
                            code: plan.giveCurrency,
                          })}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
                            plan.paused
                              ? "border-border text-muted"
                              : "border-success/40 bg-success/10 text-success"
                          }`}
                        >
                          {plan.paused ? t("recurring.paused") : t("recurring.active")}
                        </span>
                        <button
                          type="button"
                          onClick={() => togglePlan(plan.id)}
                          className="grid size-8 place-items-center rounded-full border border-border text-muted transition-colors hover:border-accent/50 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                        >
                          {plan.paused ? (
                            <Play className="size-3.5" aria-hidden />
                          ) : (
                            <Pause className="size-3.5" aria-hidden />
                          )}
                          <span className="sr-only">
                            {plan.paused ? t("recurring.resume") : t("recurring.pause")}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => deletePlan(plan.id)}
                          className="grid size-8 place-items-center rounded-full border border-border text-muted transition-colors hover:border-danger/50 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                        >
                          <Trash2 className="size-3.5" aria-hidden />
                          <span className="sr-only">
                            {t("recurring.delete", { code: plan.receiveCurrency })}
                          </span>
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <section
          aria-labelledby="new-plan-heading"
          className="surface-card rounded-3xl p-5 sm:p-6 lg:sticky lg:top-24"
        >
          <h2 id="new-plan-heading" className="text-sm font-semibold">
            {t("recurring.newTitle")}
          </h2>

          <div className="mt-4 flex flex-col gap-3.5">
            <CurrencySelect
              label={t("recurring.spend")}
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
              label={t("recurring.buy")}
              value={receiveCurrency}
              onChange={setReceiveCurrency}
              options={CRYPTO_CURRENCIES}
            />

            <fieldset>
              <legend className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
                {t("recurring.every")}
              </legend>
              <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                {CADENCES.map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={cadence === option}
                    onClick={() => setCadence(option)}
                    className={`rounded-xl border px-2 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                      cadence === option
                        ? "border-accent/50 bg-accent/10 text-accent"
                        : "border-border text-muted hover:border-accent/40 hover:text-foreground"
                    }`}
                  >
                    {t(`recurring.cadence.${option}`)}
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
                {t("recurring.startingOn")}
              </span>
              <input
                type="date"
                value={startsAt}
                onChange={(e) => {
                  setStartsAt(e.target.value);
                  setError(null);
                }}
                className="w-full rounded-xl border border-control-border bg-background px-4 py-2.5 text-sm transition-colors hover:border-accent/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
              />
            </label>

            {error && (
              <p role="alert" className="text-xs text-danger">
                {t(error.key, error.params)}
              </p>
            )}

            <button
              type="button"
              onClick={submit}
              className="gold-surface sheen mt-1 w-full rounded-xl py-3 text-sm font-semibold text-black shadow-lg shadow-accent/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 active:translate-y-0"
            >
              {t("recurring.create")}
            </button>

            <p className="flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
              <ShieldAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              {t("recurring.notice")}
            </p>
          </div>
        </section>
      </div>
    </PageContainer>
  );
}
