"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Timer, TriangleAlert } from "lucide-react";
import { CheckoutShell } from "@/components/checkout/checkout-shell";
import { DemoQr } from "@/components/checkout/demo-qr";
import { startProcessing } from "@/lib/history-store";
import { useT } from "@/lib/i18n/context";

const WINDOW_SECONDS = 900;

/** Intentionally malformed: the DEMO prefix and length mean no wallet will
 *  accept it, so funds cannot be sent even by mistake. */
function demoDepositAddress(id: string, currency: string): string {
  return `DEMO-${currency}-NOT-A-REAL-ADDRESS-${id.replace(/-/g, "").slice(0, 12).toUpperCase()}`;
}

function formatAmount(value: number): string {
  if (value >= 1000) return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (value >= 1) return value.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
  return value.toFixed(8).replace(/0+$/, "").replace(/\.$/, "");
}

export default function DepositPage() {
  const t = useT();
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(WINDOW_SECONDS);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const mm = Math.floor(secondsLeft / 60);
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <CheckoutShell
      step="deposit"
      title={t("deposit.title")}
      subtitle={t("deposit.subtitle")}
    >
      {(request) => {
        const address = demoDepositAddress(request.id, request.giveCurrency);

        return (
          <>
            <p className="flex items-start gap-2 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              {t("deposit.warning")}
            </p>

            <div className="mt-5 flex flex-col items-center gap-4 rounded-2xl border border-border/70 p-5">
              <p className="text-center text-sm">
                {t("deposit.sendExactly")}{" "}
                <span className="font-semibold tabular-nums">
                  {formatAmount(request.giveAmount)} {request.giveCurrency}
                </span>
              </p>

              <DemoQr seed={request.id} />

              <div className="w-full">
                <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
                  {t("deposit.address")}
                </span>
                <div className="mt-1.5 flex items-center gap-2">
                  <code className="flex-1 break-all rounded-xl border border-control-border bg-background px-3 py-2.5 font-mono text-xs">
                    {address}
                  </code>
                  <button
                    type="button"
                    aria-label={t("deposit.copy")}
                    onClick={() => {
                      void navigator.clipboard?.writeText(address);
                      setCopied(true);
                      window.setTimeout(() => setCopied(false), 1500);
                    }}
                    className="grid size-10 shrink-0 place-items-center rounded-xl border border-border text-muted transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 active:translate-y-0"
                  >
                    {copied ? (
                      <Check className="size-4 text-success" aria-hidden />
                    ) : (
                      <Copy className="size-4" aria-hidden />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <p className="flex items-center gap-1.5 text-sm text-muted" aria-live="polite">
                  <Timer className="size-3.5" aria-hidden />
                  {secondsLeft === 0 ? (
                    t("deposit.expired")
                  ) : (
                    <>
                      {t("deposit.closesIn")}{" "}
                      <span className="font-medium tabular-nums text-foreground">
                        {mm}:{ss}
                      </span>
                    </>
                  )}
                </p>
                {/* WCAG 2.2.1: the window can always be reopened. */}
                <button
                  type="button"
                  onClick={() => setSecondsLeft(WINDOW_SECONDS)}
                  className="rounded-full border border-border px-3 py-1 text-xs font-medium transition-colors hover:border-accent/50 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                >
                  {secondsLeft === 0 ? t("deposit.reopen") : t("confirm.extend")}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                startProcessing(request.id);
                router.push(`/exchange/${request.id}`);
              }}
              className="gold-surface sheen mt-6 w-full rounded-xl py-3.5 text-base font-semibold text-black shadow-lg shadow-accent/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 active:translate-y-0"
            >
              {t("deposit.simulate")}
            </button>
          </>
        );
      }}
    </CheckoutShell>
  );
}
