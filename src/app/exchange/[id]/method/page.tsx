"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Banknote, CreditCard, Wallet, Zap } from "lucide-react";
import { CheckoutShell } from "@/components/checkout/checkout-shell";
import { nextStep } from "@/lib/checkout-flow";
import { setPaymentMethod, setStep } from "@/lib/history-store";
import type { PaymentMethod } from "@/types/exchange-request";

const METHODS: {
  id: PaymentMethod;
  icon: typeof CreditCard;
  title: string;
  body: string;
  note: string;
}[] = [
  {
    id: "card",
    icon: CreditCard,
    title: "Debit or credit card",
    body: "Instant. Includes a simulated 3-D Secure confirmation step.",
    note: "Test card only",
  },
  {
    id: "bank",
    icon: Banknote,
    title: "Bank transfer",
    body: "Lower fee, settles in 1–2 business days.",
    note: "Demo IBAN",
  },
  {
    id: "crypto",
    icon: Wallet,
    title: "Crypto deposit",
    body: "Send from your own wallet to a deposit address.",
    note: "Address is not spendable",
  },
  {
    id: "demo-balance",
    icon: Zap,
    title: "Demo balance",
    body: "Skip payment details entirely and see the full flow instantly.",
    note: "Fastest",
  },
];

export default function MethodPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<PaymentMethod | null>(null);

  return (
    <CheckoutShell
      step="method"
      title="How would you like to pay?"
      subtitle="The next steps adapt to the method you pick."
    >
      {(request) => (
        <>
          <div
            role="radiogroup"
            aria-label="Payment method"
            className="flex flex-col gap-2.5"
          >
            {METHODS.map(({ id, icon: Icon, title, body, note }) => {
              const isSelected = (selected ?? request.paymentMethod) === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setSelected(id)}
                  className={`flex items-start gap-3.5 rounded-2xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 ${
                    isSelected
                      ? "border-accent/60 bg-accent/8 shadow-lg shadow-accent/10"
                      : "border-border hover:border-accent/40"
                  }`}
                >
                  <span
                    className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl border transition-colors ${
                      isSelected
                        ? "border-accent/40 bg-accent/15 text-accent"
                        : "border-border text-muted"
                    }`}
                  >
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <span className="flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{title}</span>
                      <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted">
                        {note}
                      </span>
                    </span>
                    <span className="mt-1 block text-sm text-muted">{body}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            disabled={!(selected ?? request.paymentMethod)}
            onClick={() => {
              const method = selected ?? request.paymentMethod;
              if (!method) return;
              setPaymentMethod(request.id, method);
              const next = nextStep("method", method);
              setStep(request.id, next);
              router.push(
                `/exchange/${request.id}/${next === "status" ? "" : next}`.replace(/\/$/, "")
              );
            }}
            className="gold-surface mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-base font-semibold text-black shadow-lg shadow-accent/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 active:translate-y-0 disabled:pointer-events-none disabled:opacity-45"
          >
            Continue
            <ArrowRight className="size-4" aria-hidden />
          </button>
        </>
      )}
    </CheckoutShell>
  );
}
