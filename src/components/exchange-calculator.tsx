"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CurrencySelect } from "@/components/currency-select";
import { computeExchangeAmount } from "@/lib/exchange-calc";
import { DEFAULT_FEE_PERCENT, MAX_AMOUNT_USD, MIN_AMOUNT_USD } from "@/lib/limits";
import { createRequest } from "@/lib/history-store";
import { validateExchangeRequest } from "@/lib/exchange-calc";
import { isSupportedCurrency } from "@/lib/currencies";

type RateResponse = { rate: number; updatedAt: string };

export function ExchangeCalculator() {
  const router = useRouter();
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
        const res = await fetch(
          `/api/rates?from=${giveCurrency}&to=${receiveCurrency}`
        );
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

  function swapCurrencies() {
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
      giveCurrency,
      receiveCurrency,
      giveAmount: result.giveAmount,
      receiveAmount: result.receiveAmount,
      feeAmount: result.feeAmount,
      rateAtCreation: rate,
      recipientContact: contact.trim(),
    });
    router.push(`/exchange/${request.id}`);
  }

  return (
    <div className="mx-auto max-w-md w-full px-4 py-8 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Exchange calculator</h1>
        <p className="text-sm text-muted mt-1">
          Live rates, transparent fee, simulated requests.
        </p>
      </div>

      <div className="flex flex-col gap-3 bg-card border border-border rounded-lg p-4">
        <CurrencySelect label="You give" value={giveCurrency} onChange={setGiveCurrency} />

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Amount</span>
          <input
            type="number"
            min={0}
            value={giveAmount}
            onChange={(e) => setGiveAmount(e.target.value)}
            className="border border-border rounded-md px-3 py-2 bg-background"
          />
        </label>

        <button
          type="button"
          onClick={swapCurrencies}
          className="self-center text-xs text-accent hover:underline"
        >
          ⇅ swap
        </button>

        <CurrencySelect
          label="You receive"
          value={receiveCurrency}
          onChange={setReceiveCurrency}
        />
      </div>

      <div className="bg-card border border-border rounded-lg p-4 text-sm flex flex-col gap-2">
        {rateLoading && <p className="text-muted">Loading live rate…</p>}
        {rateError && <p className="text-red-500">{rateError}</p>}
        {result && rate && !rateLoading && !rateError && (
          <>
            <div className="flex justify-between">
              <span className="text-muted">Exchange rate</span>
              <span>
                1 {giveCurrency} = {rate.toFixed(6)} {receiveCurrency}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Fee ({DEFAULT_FEE_PERCENT}%)</span>
              <span>
                {result.feeAmount.toFixed(6)} {receiveCurrency}
              </span>
            </div>
            <div className="flex justify-between font-medium">
              <span>You receive</span>
              <span>
                {result.receiveAmount.toFixed(6)} {receiveCurrency}
              </span>
            </div>
            {rateUpdatedAt && (
              <p className="text-xs text-muted">
                Updated {new Date(rateUpdatedAt).toLocaleTimeString()}
              </p>
            )}
          </>
        )}
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted">Contact (demo — email or any string)</span>
        <input
          type="text"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="you@example.com"
          className="border border-border rounded-md px-3 py-2 bg-background"
        />
      </label>

      {submitError && <p className="text-sm text-red-500">{submitError}</p>}

      <button
        type="button"
        onClick={handleCreateRequest}
        disabled={!result || rateLoading}
        className="bg-accent text-white rounded-md py-2 font-medium disabled:opacity-50"
      >
        Create demo exchange request
      </button>
    </div>
  );
}
