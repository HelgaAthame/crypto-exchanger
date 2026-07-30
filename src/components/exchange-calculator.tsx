"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDown, Loader2, ShieldCheck, TriangleAlert } from "lucide-react";
import { CurrencySelect } from "@/components/currency-select";
import { OperationTabs } from "@/components/operation-tabs";
import { computeExchangeAmount, validateExchangeRequest } from "@/lib/exchange-calc";
import { DEFAULT_FEE_PERCENT, MAX_AMOUNT_USD, MIN_AMOUNT_USD } from "@/lib/limits";
import { createRequest } from "@/lib/history-store";
import { CRYPTO_CURRENCIES, FIAT_CURRENCIES, isSupportedCurrency } from "@/lib/currencies";
import {
  defaultPairForMode,
  invertMode,
  kindsForMode,
  payoutLabelForMode,
  type OperationMode,
} from "@/lib/operations";

type RateResponse = { rate: number; updatedAt: string };

function formatAmount(value: number): string {
  if (value === 0) return "0";
  if (value >= 1000) return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (value >= 1) return value.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
  return value.toFixed(8).replace(/0+$/, "").replace(/\.$/, "");
}

export function ExchangeCalculator() {
  const router = useRouter();
  const [mode, setMode] = useState<OperationMode>("buy");
  const [giveCurrency, setGiveCurrency] = useState("USD");
  const [receiveCurrency, setReceiveCurrency] = useState("BTC");
  const [giveAmount, setGiveAmount] = useState("100");
  const [rate, setRate] = useState<number | null>(null);
  const [rateUpdatedAt, setRateUpdatedAt] = useState<string | null>(null);
  const [rateLoading, setRateLoading] = useState(false);
  const [rateError, setRateError] = useState<string | null>(null);
  const [contact, setContact] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadRate() {
      setRateLoading(true);
      setRateError(null);
      try {
        const res = await fetch(`/api/rates?from=${giveCurrency}&to=${receiveCurrency}`);
        if (!res.ok) throw new Error("failed");
        const data = (await res.json()) as RateResponse;
        if (!cancelled) {
          setRate(data.rate);
          setRateUpdatedAt(data.updatedAt);
        }
      } catch {
        if (!cancelled) setRateError("Could not load live rate. Try again.");
      } finally {
        if (!cancelled) setRateLoading(false);
      }
    }
    loadRate();
    return () => {
      cancelled = true;
    };
  }, [giveCurrency, receiveCurrency]);

  const amountNumber = Number(giveAmount);
  const result =
    rate && amountNumber > 0
      ? computeExchangeAmount({
          amount: amountNumber,
          direction: "give",
          rate,
          feePercent: DEFAULT_FEE_PERCENT,
        })
      : null;

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
      amount: amountNumber,
      giveCurrency,
      receiveCurrency,
      minAmount: MIN_AMOUNT_USD,
      maxAmount: MAX_AMOUNT_USD,
      isCurrencySupported: isSupportedCurrency,
    });
    if (!validation.valid) {
      setSubmitError(validation.errors[0]);
      return;
    }
    if (!contact.trim()) {
      setSubmitError("Please enter a contact (e.g. email) for the demo request");
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
    <div className="surface-card rounded-3xl p-5 sm:p-7">
        <div className="mb-5">
          <OperationTabs value={mode} onChange={changeMode} />
        </div>

        <div className="relative flex flex-col gap-3">
          <div className="rounded-2xl bg-background/60 p-4">
            <CurrencySelect
              label="You give"
              value={giveCurrency}
              onChange={setGiveCurrency}
              options={giveOptions}
            />
            <label className="mt-3 flex flex-col gap-1.5">
              <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
                Amount
              </span>
              <input
                type="number"
                min={0}
                value={giveAmount}
                onChange={(e) => setGiveAmount(e.target.value)}
                className="w-full rounded-xl border border-control-border bg-background px-4 py-3 text-2xl font-semibold tabular-nums transition-colors hover:border-accent/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={swapCurrencies}
            aria-label="Swap currencies"
            className="group absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border bg-card p-2.5 text-accent shadow-lg transition-all duration-300 hover:scale-110 hover:border-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 active:scale-95"
          >
            <ArrowUpDown
              className="size-4 transition-transform duration-300 group-hover:rotate-180"
              aria-hidden
            />
          </button>

          <div className="rounded-2xl bg-background/60 p-4">
            <CurrencySelect
              label="You receive"
              value={receiveCurrency}
              onChange={setReceiveCurrency}
              options={receiveOptions}
            />
            <div className="mt-3">
              <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
                Estimated amount
              </span>
              <p className="mt-1.5 min-h-10 text-3xl font-semibold tabular-nums">
                {rateLoading ? (
                  <Loader2 className="size-6 animate-spin text-muted" aria-label="Loading" />
                ) : result ? (
                  <>
                    <span className="gold-text">{formatAmount(result.receiveAmount)}</span>{" "}
                    <span className="text-lg font-medium text-muted">{receiveCurrency}</span>
                  </>
                ) : (
                  <span className="text-lg font-normal text-muted">—</span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-border/70 p-4 text-sm">
          {rateError ? (
            <p className="flex items-center gap-2 text-danger">
              <TriangleAlert className="size-4 shrink-0" aria-hidden />
              {rateError}
            </p>
          ) : (
            <div className="flex flex-col gap-2.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-muted">Market rate</span>
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
                <span className="text-muted">Service fee ({DEFAULT_FEE_PERCENT}%)</span>
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
                <span>You receive</span>
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
                  Updated {new Date(rateUpdatedAt).toLocaleTimeString()}
                </p>
              )}
            </div>
          )}
        </div>

        <label className="mt-4 flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
            Contact for your {payoutLabelForMode(mode)} — demo, any email
          </span>
          <input
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="you@example.com"
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
            {submitError}
          </p>
        )}

        <button
          type="button"
          onClick={handleCreateRequest}
          disabled={!result || rateLoading}
          className="gold-surface mt-5 w-full rounded-xl py-3.5 text-base font-semibold text-black shadow-lg shadow-accent/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-accent/30 active:translate-y-0 disabled:pointer-events-none disabled:opacity-45"
        >
          Continue to payment
        </button>

        <p className="mt-3.5 flex items-center justify-center gap-1.5 text-xs text-muted">
          <ShieldCheck className="size-3.5 text-accent" aria-hidden />
        Simulated request — nothing is charged and no funds move
      </p>
    </div>
  );
}
