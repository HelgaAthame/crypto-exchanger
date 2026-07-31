"use client";

import { ArrowRight } from "lucide-react";
import { CurrencyIcon } from "@/components/currency-icon";
import type { ExchangeRequest, PaymentMethod } from "@/types/exchange-request";
import { useT } from "@/lib/i18n/context";

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

/** Stays visible through every checkout step, so the numbers never leave view. */
export function OrderSummary({ request }: { request: ExchangeRequest }) {
  const t = useT();
  return (
    <aside
      aria-labelledby="order-summary-heading"
      className="surface-card rounded-3xl p-5 lg:sticky lg:top-24"
    >
      <h2 id="order-summary-heading" className="text-sm font-semibold">
        {t("checkout.summary")}
      </h2>

      <div className="mt-4 flex items-center justify-between gap-2 rounded-2xl bg-background/60 p-3.5">
        <span className="flex items-center gap-2 text-sm">
          <CurrencyIcon code={request.giveCurrency} />
          <span className="font-medium tabular-nums">
            {formatAmount(request.giveAmount)}
          </span>
          <span className="text-muted">{request.giveCurrency}</span>
        </span>
        <ArrowRight className="size-4 shrink-0 text-accent" aria-hidden />
        <span className="flex items-center gap-2 text-sm">
          <CurrencyIcon code={request.receiveCurrency} />
          <span className="font-medium tabular-nums">
            {formatAmount(request.receiveAmount)}
          </span>
          <span className="text-muted">{request.receiveCurrency}</span>
        </span>
      </div>

      <dl className="mt-4 flex flex-col gap-2.5 text-sm">
        <Row
          label={t("checkout.rate")}
          value={`1 ${request.giveCurrency} = ${formatAmount(request.rateAtCreation)} ${request.receiveCurrency}`}
        />
        <Row
          label={t("checkout.fee")}
          value={`${formatAmount(request.feeAmount)} ${request.receiveCurrency}`}
        />
        {request.paymentMethod && (
          <Row label={t("checkout.method")} value={t(METHOD_KEY[request.paymentMethod])} />
        )}
        <Row label={t("checkout.contact")} value={request.recipientContact} />
      </dl>
    </aside>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="break-all text-right">{value}</dd>
    </div>
  );
}
