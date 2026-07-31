"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Timer } from "lucide-react";
import { CheckoutShell } from "@/components/checkout/checkout-shell";
import { nextStep } from "@/lib/checkout-flow";
import { setStep, startProcessing } from "@/lib/history-store";
import { useT } from "@/lib/i18n/context";
import type { ExchangeRequest, PaymentMethod } from "@/types/exchange-request";

const RATE_LOCK_SECONDS = 120;

const METHOD_KEY: Record<PaymentMethod, string> = {
  card: "method.card",
  bank: "method.bank",
  crypto: "method.crypto",
  "demo-balance": "method.balance",
};

function formatAmount(value: number): string {
  if (value >= 1000) return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (value >= 1) return value.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
  return value.toFixed(8).replace(/0+$/, "").replace(/\.$/, "");
}

function describeDetails(request: ExchangeRequest): string {
  const d = request.paymentDetails;
  if (!d) return "—";
  if (d.cardLast4) return `•••• ${d.cardLast4}${d.cardHolder ? ` · ${d.cardHolder}` : ""}`;
  if (d.iban) return `${d.iban}${d.accountHolder ? ` · ${d.accountHolder}` : ""}`;
  if (d.payoutAddress) {
    const a = d.payoutAddress;
    return a.length > 18 ? `${a.slice(0, 10)}…${a.slice(-6)}` : a;
  }
  return "—";
}

export default function ConfirmPage() {
  const t = useT();
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(RATE_LOCK_SECONDS);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const expired = secondsLeft === 0;
  const mm = Math.floor(secondsLeft / 60);
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <CheckoutShell
      step="confirm"
      title={t("confirm.title")}
      subtitle={t("confirm.subtitle")}
    >
      {(request) => (
        <>
          <div className="rounded-2xl border border-border/70 p-4">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-2xl font-semibold tabular-nums">
              <span>
                {formatAmount(request.giveAmount)}{" "}
                <span className="text-base font-medium text-muted">
                  {request.giveCurrency}
                </span>
              </span>
              <span className="text-accent">→</span>
              <span>
                <span className="gold-text">{formatAmount(request.receiveAmount)}</span>{" "}
                <span className="text-base font-medium text-muted">
                  {request.receiveCurrency}
                </span>
              </span>
            </div>

            <dl className="mt-4 flex flex-col gap-2.5 border-t border-border/70 pt-4 text-sm">
              {request.mode && (
                <Row
                  label={t("confirm.operation")}
                  value={t(`calc.mode.${request.mode}`)}
                />
              )}
              <Row
                label={t("confirm.rate")}
                value={`1 ${request.giveCurrency} = ${formatAmount(request.rateAtCreation)} ${request.receiveCurrency}`}
              />
              <Row
                label={t("confirm.fee")}
                value={`${formatAmount(request.feeAmount)} ${request.receiveCurrency}`}
              />
              <Row
                label={t("confirm.paymentMethod")}
                value={
                  request.paymentMethod ? t(METHOD_KEY[request.paymentMethod]) : "—"
                }
              />
              {request.paymentMethod !== "demo-balance" && (
                <Row label={t("confirm.details")} value={describeDetails(request)} />
              )}
              <Row label={t("confirm.contact")} value={request.recipientContact} />
            </dl>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
            <p
              className={`flex items-center gap-1.5 ${expired ? "text-danger" : "text-muted"}`}
              aria-live="polite"
            >
              <Timer className="size-3.5" aria-hidden />
              {expired ? (
                t("confirm.expired")
              ) : (
                <>
                  {t("confirm.locked")}{" "}
                  <span className="font-medium tabular-nums text-foreground">
                    {mm}:{ss}
                  </span>
                </>
              )}
            </p>

            {/* WCAG 2.2.1: the countdown must never be able to strand the user. */}
            <button
              type="button"
              onClick={() => setSecondsLeft(RATE_LOCK_SECONDS)}
              className="rounded-full border border-border px-3 py-1 text-xs font-medium transition-colors hover:border-accent/50 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              {expired ? t("confirm.restart") : t("confirm.extend")}
            </button>
          </div>

          <button
            type="button"
            disabled={expired}
            onClick={() => {
              const next = nextStep("confirm", request.paymentMethod);
              if (next === "status") {
                startProcessing(request.id);
                router.push(`/exchange/${request.id}`);
                return;
              }
              setStep(request.id, next);
              router.push(`/exchange/${request.id}/${next}`);
            }}
            className="gold-surface sheen mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-base font-semibold text-black shadow-lg shadow-accent/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 active:translate-y-0 disabled:pointer-events-none disabled:opacity-45"
          >
            <Lock className="size-4" aria-hidden />
            {t("confirm.pay")}
          </button>
        </>
      )}
    </CheckoutShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="break-all text-right">{value}</dd>
    </div>
  );
}
