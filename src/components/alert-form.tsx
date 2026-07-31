"use client";

import { useState } from "react";
import { BellPlus, Check } from "lucide-react";
import { suggestDirection, validateAlert } from "@/lib/alerts";
import { createAlert } from "@/lib/alerts-store";
import { isSupportedCurrency } from "@/lib/currencies";
import { useT } from "@/lib/i18n/context";

type Props = {
  giveCurrency: string;
  receiveCurrency: string;
  currentRate: number | null;
};

export function AlertForm({ giveCurrency, receiveCurrency, currentRate }: Props) {
  const t = useT();
  const [target, setTarget] = useState("");
  const [error, setError] = useState<
    { key: string; params?: Record<string, string | number> } | null
  >(null);
  const [created, setCreated] = useState(false);

  const targetNumber = Number(target);
  const direction =
    currentRate && targetNumber > 0 ? suggestDirection(targetNumber, currentRate) : null;

  function submit() {
    setError(null);
    if (!currentRate) return;

    const result = validateAlert({
      targetRate: targetNumber,
      currentRate,
      giveCurrency,
      receiveCurrency,
      isCurrencySupported: isSupportedCurrency,
    });
    if (!result.valid) {
      const issue = result.issues[0];
      setError({ key: `validation.${issue.code}`, params: issue.params });
      return;
    }

    createAlert({
      giveCurrency,
      receiveCurrency,
      direction: suggestDirection(targetNumber, currentRate),
      targetRate: targetNumber,
      rateAtCreation: currentRate,
    });
    setTarget("");
    setCreated(true);
    window.setTimeout(() => setCreated(false), 4000);
  }

  return (
    <div className="mt-3">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
          {t("alerts.formLabel", { code: giveCurrency })}
        </span>
        <div className="flex gap-2">
          <input
            type="number"
            min={0}
            inputMode="decimal"
            value={target}
            onChange={(e) => {
              setTarget(e.target.value);
              setError(null);
            }}
            placeholder={currentRate ? currentRate.toFixed(2) : "0"}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "alert-error" : "alert-hint"}
            className="min-w-0 flex-1 rounded-xl border border-control-border bg-background px-4 py-2.5 text-sm tabular-nums transition-colors hover:border-accent/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
          />
          <button
            type="button"
            onClick={submit}
            disabled={!currentRate || targetNumber <= 0}
            className="sheen-border inline-flex shrink-0 items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 active:translate-y-0 disabled:pointer-events-none disabled:opacity-45"
          >
            {created ? (
              <Check className="size-4 text-success" aria-hidden />
            ) : (
              <BellPlus className="size-4" aria-hidden />
            )}
            {created ? t("alerts.saved") : t("alerts.save")}
          </button>
        </div>
      </label>

      {error ? (
        <p id="alert-error" role="alert" className="mt-2 text-xs text-danger">
          {t(error.key, error.params)}
        </p>
      ) : (
        <p id="alert-hint" className="mt-2 text-xs text-muted">
          {direction
            ? t("alerts.fires", {
                direction: t(`alerts.${direction}`),
                target: targetNumber,
                code: receiveCurrency,
              })
            : t("alerts.current", {
                rate: currentRate ? currentRate.toFixed(4) : "—",
                code: receiveCurrency,
              })}{" "}
          {t("alerts.noDelivery")}
        </p>
      )}
    </div>
  );
}
