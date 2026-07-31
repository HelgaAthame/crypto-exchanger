"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown, Loader2, ShieldCheck, TriangleAlert } from "lucide-react";
import { CurrencySelect } from "@/components/currency-select";
import { OperationTabs } from "@/components/operation-tabs";
import { RateChart } from "@/components/rate-chart";
import { computeExchangeAmount, validateExchangeRequest } from "@/lib/exchange-calc";
import { DEFAULT_FEE_PERCENT, MAX_AMOUNT_USD, MIN_AMOUNT_USD } from "@/lib/limits";
import { createRequest } from "@/lib/history-store";
import {
  CRYPTO_CURRENCIES,
  FIAT_CURRENCIES,
  getCurrency,
  isSupportedCurrency,
} from "@/lib/currencies";
import {
  OPERATION_MODES,
  defaultPairForMode,
  invertMode,
  kindsForMode,
  payoutLabelForMode,
  type OperationMode,
} from "@/lib/operations";
import { useT } from "@/lib/i18n/context";

type RateResponse = { rate: number; updatedAt: string };

function formatAmount(value: number): string {
  if (value === 0) return "0";
  if (value >= 1000) return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (value >= 1) return value.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
  return value.toFixed(8).replace(/0+$/, "").replace(/\.$/, "");
}

export function ExchangeCalculator() {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();

  // A currency page can deep-link into a prefilled pair, e.g. /?mode=buy&receive=BTC.
  const [mode, setMode] = useState<OperationMode>(() => {
    const requested = searchParams.get("mode");
    return OPERATION_MODES.some((m) => m.id === requested)
      ? (requested as OperationMode)
      : "buy";
  });
  const initialPair = (() => {
    const pair = defaultPairForMode(mode);
    const give = searchParams.get("give")?.toUpperCase();
    const receive = searchParams.get("receive")?.toUpperCase();
    const kinds = kindsForMode(mode);
    return {
      give: give && getCurrency(give)?.kind === kinds.give ? give : pair.give,
      receive:
        receive && getCurrency(receive)?.kind === kinds.receive ? receive : pair.receive,
    };
  })();

  const [giveCurrency, setGiveCurrency] = useState(initialPair.give);
  const [receiveCurrency, setReceiveCurrency] = useState(initialPair.receive);
  // One amount plus the side it was typed on — the other side is derived, so
  // the two inputs can never disagree.
  const [amount, setAmount] = useState("100");
  const [direction, setDirection] = useState<"give" | "receive">("give");
  const [rate, setRate] = useState<number | null>(null);
  const [rateUpdatedAt, setRateUpdatedAt] = useState<string | null>(null);
  const [rateLoading, setRateLoading] = useState(false);
  // Store the failure as a flag, not a translated string: the copy has to
  // follow the active language, and keeping text in state would also make the
  // fetch effect depend on the translator.
  const [rateFailed, setRateFailed] = useState(false);
  const [contact, setContact] = useState("");
  // Keep the reason, not the sentence, so the message follows the language.
  const [submitError, setSubmitError] = useState<
    { key: string; params?: Record<string, string | number> } | null
  >(null);

  useEffect(() => {
    let cancelled = false;
    async function loadRate() {
      setRateLoading(true);
      setRateFailed(false);
      try {
        const res = await fetch(`/api/rates?from=${giveCurrency}&to=${receiveCurrency}`);
        if (!res.ok) throw new Error("failed");
        const data = (await res.json()) as RateResponse;
        if (!cancelled) {
          setRate(data.rate);
          setRateUpdatedAt(data.updatedAt);
        }
      } catch {
        if (!cancelled) setRateFailed(true);
      } finally {
        if (!cancelled) setRateLoading(false);
      }
    }
    loadRate();
    return () => {
      cancelled = true;
    };
  }, [giveCurrency, receiveCurrency]);

  const amountNumber = Number(amount);
  const result =
    rate && amountNumber > 0
      ? computeExchangeAmount({
          amount: amountNumber,
          direction,
          rate,
          feePercent: DEFAULT_FEE_PERCENT,
        })
      : null;

  /** The side being typed on shows the raw text; the other shows the result. */
  function fieldValue(side: "give" | "receive"): string {
    if (direction === side) return amount;
    if (!result) return "";
    return formatAmount(side === "give" ? result.giveAmount : result.receiveAmount);
  }

  function editAmount(side: "give" | "receive", next: string) {
    setDirection(side);
    setAmount(next);
  }

  const kinds = kindsForMode(mode);
  const giveOptions = kinds.give === "fiat" ? FIAT_CURRENCIES : CRYPTO_CURRENCIES;
  const receiveOptions = kinds.receive === "fiat" ? FIAT_CURRENCIES : CRYPTO_CURRENCIES;

  function changeMode(next: OperationMode) {
    setMode(next);
    // Snap to a pair the new mode actually allows.
    const pair = defaultPairForMode(next);
    setGiveCurrency(pair.give);
    setReceiveCurrency(pair.receive);
  }

  function swapCurrencies() {
    // Flipping the sides of a Buy is a Sell, so the mode follows the pair.
    setMode(invertMode(mode));
    setGiveCurrency(receiveCurrency);
    setReceiveCurrency(giveCurrency);
  }

  function handleCreateRequest() {
    setSubmitError(null);
    if (!result || !rate) return;

    const validation = validateExchangeRequest({
      // Limits apply to what the user pays, whichever side they typed on.
      amount: result.giveAmount,
      giveCurrency,
      receiveCurrency,
      minAmount: MIN_AMOUNT_USD,
      maxAmount: MAX_AMOUNT_USD,
      isCurrencySupported: isSupportedCurrency,
    });
    if (!validation.valid) {
      const issue = validation.issues[0];
      setSubmitError({ key: `validation.${issue.code}`, params: issue.params });
      return;
    }
    if (!contact.trim()) {
      setSubmitError({ key: "calc.errorContact" });
      return;
    }

    const request = createRequest({
      mode,
      giveCurrency,
      receiveCurrency,
      giveAmount: result.giveAmount,
      receiveAmount: result.receiveAmount,
      feeAmount: result.feeAmount,
      rateAtCreation: rate,
      recipientContact: contact.trim(),
    });
    router.push(`/exchange/${request.id}/method`);
  }

  return (
    <>
      <div className="surface-card rounded-3xl p-5 sm:p-7">
        <div className="mb-5">
          <OperationTabs value={mode} onChange={changeMode} />
        </div>

        <div className="relative flex flex-col gap-3">
          <div className="rounded-2xl bg-background/60 p-4">
            <CurrencySelect
              label={t("calc.youGive")}
              value={giveCurrency}
              onChange={setGiveCurrency}
              options={giveOptions}
            />
            <label className="mt-3 flex flex-col gap-1.5">
              <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
                {direction === "receive" ? t("calc.amountEstimated") : t("calc.amount")}
              </span>
              <input
                type="number"
                min={0}
                inputMode="decimal"
                value={fieldValue("give")}
                onChange={(e) => editAmount("give", e.target.value)}
                className="w-full rounded-xl border border-control-border bg-background px-4 py-3 text-2xl font-semibold tabular-nums transition-colors hover:border-accent/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={swapCurrencies}
            aria-label={t("calc.swap")}
            className="group absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border bg-card p-2.5 text-accent shadow-lg transition-all duration-300 hover:scale-110 hover:border-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 active:scale-95"
          >
            <ArrowUpDown
              className="size-4 transition-transform duration-300 group-hover:rotate-180"
              aria-hidden
            />
          </button>

          <div className="rounded-2xl bg-background/60 p-4">
            <CurrencySelect
              label={t("calc.youReceive")}
              value={receiveCurrency}
              onChange={setReceiveCurrency}
              options={receiveOptions}
            />
            <label className="mt-3 flex flex-col gap-1.5">
              <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
                {direction === "give" ? t("calc.amountEstimated") : t("calc.amount")}
              </span>
              <span className="relative">
                <input
                  type="number"
                  min={0}
                  inputMode="decimal"
                  value={fieldValue("receive")}
                  onChange={(e) => editAmount("receive", e.target.value)}
                  placeholder="0"
                  className="w-full rounded-xl border border-control-border bg-background px-4 py-3 text-2xl font-semibold tabular-nums transition-colors hover:border-accent/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
                />
                {rateLoading && (
                  <Loader2
                    className="absolute right-3.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted"
                    aria-label={t("calc.loadingRateLabel")}
                  />
                )}
              </span>
            </label>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-border/70 p-4 text-sm">
          {rateFailed ? (
            <p className="flex items-center gap-2 text-danger">
              <TriangleAlert className="size-4 shrink-0" aria-hidden />
              {t("calc.rateError")}
            </p>
          ) : (
            <div className="flex flex-col gap-2.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-muted">{t("calc.rate")}</span>
                <span className="tabular-nums">
                  {rate ? (
                    <>
                      1 {giveCurrency} = {formatAmount(rate)} {receiveCurrency}
                    </>
                  ) : (
                    "—"
                  )}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-muted">
                  {t("calc.fee", { percent: DEFAULT_FEE_PERCENT })}
                </span>
                <span className="tabular-nums">
                  {result ? (
                    <>
                      {formatAmount(result.feeAmount)} {receiveCurrency}
                    </>
                  ) : (
                    "—"
                  )}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-3 border-t border-border/70 pt-2.5 font-medium">
                <span>{t("calc.total")}</span>
                <span className="tabular-nums">
                  {result ? (
                    <>
                      {formatAmount(result.receiveAmount)} {receiveCurrency}
                    </>
                  ) : (
                    "—"
                  )}
                </span>
              </div>
              {rateUpdatedAt && (
                <p className="text-xs text-muted">
                  {t("calc.updated", {
                    time: new Date(rateUpdatedAt).toLocaleTimeString(),
                  })}
                </p>
              )}
            </div>
          )}
        </div>

        <label className="mt-4 flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
            {t("calc.contact", { payout: t(`payout.${payoutLabelForMode(mode) === "wallet address" ? "wallet" : "bank"}`) })}
          </span>
          <input
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder={t("calc.contactPlaceholder")}
            aria-invalid={submitError ? true : undefined}
            aria-describedby={submitError ? "calculator-error" : undefined}
            className="w-full rounded-xl border border-control-border bg-background px-4 py-3 text-sm transition-colors hover:border-accent/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
          />
        </label>

        {submitError && (
          <p
            id="calculator-error"
            role="alert"
            className="mt-3 flex items-center gap-2 text-sm text-danger"
          >
            <TriangleAlert className="size-4 shrink-0" aria-hidden />
            {t(submitError.key, submitError.params)}
          </p>
        )}

        <button
          type="button"
          onClick={handleCreateRequest}
          disabled={!result || rateLoading}
          className="gold-surface sheen mt-5 w-full rounded-xl py-3.5 text-base font-semibold text-black shadow-lg shadow-accent/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-accent/30 active:translate-y-0 disabled:pointer-events-none disabled:opacity-45"
        >
          {t("calc.submit")}
        </button>

        <p className="mt-3.5 flex items-center justify-center gap-1.5 text-xs text-muted">
          <ShieldCheck className="size-3.5 text-accent" aria-hidden />
          {t("calc.disclaimer")}
        </p>
      </div>

      <RateChart from={giveCurrency} to={receiveCurrency} />
    </>
  );
}
