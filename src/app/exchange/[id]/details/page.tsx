"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock } from "lucide-react";
import { CheckoutShell } from "@/components/checkout/checkout-shell";
import { nextStep } from "@/lib/checkout-flow";
import { setPaymentDetails, setStep } from "@/lib/history-store";
import type { PaymentDetails } from "@/types/exchange-request";

/** Widely published test card number — deliberately not a usable card. */
const DEMO_CARD = "4242 4242 4242 4242";
const DEMO_IBAN = "DE00 0000 0000 0000 0000 00";

const FIELD =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm transition-colors hover:border-accent/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25";

export default function DetailsPage() {
  const router = useRouter();
  const [cardHolder, setCardHolder] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [payoutAddress, setPayoutAddress] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <CheckoutShell
      step="details"
      title="Payment details"
      subtitle="Nothing here is validated against a real payment network."
    >
      {(request) => {
        const method = request.paymentMethod;

        function submit() {
          setError(null);
          let details: PaymentDetails;

          if (method === "card") {
            if (!cardHolder.trim()) {
              setError("Enter the name on the card");
              return;
            }
            details = { cardHolder: cardHolder.trim(), cardLast4: "4242" };
          } else if (method === "bank") {
            if (!accountHolder.trim()) {
              setError("Enter the account holder name");
              return;
            }
            details = { accountHolder: accountHolder.trim(), iban: DEMO_IBAN };
          } else {
            if (!payoutAddress.trim()) {
              setError("Enter the address that should receive the funds");
              return;
            }
            details = { payoutAddress: payoutAddress.trim() };
          }

          setPaymentDetails(request.id, details);
          const next = nextStep("details", method);
          setStep(request.id, next);
          router.push(`/exchange/${request.id}/${next}`);
        }

        return (
          <>
            {method === "card" && (
              <div className="flex flex-col gap-3.5">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
                    Card number
                  </span>
                  <span className="relative">
                    <input
                      readOnly
                      value={DEMO_CARD}
                      aria-describedby="card-note"
                      className={`${FIELD} cursor-not-allowed tabular-nums opacity-70`}
                    />
                    <Lock
                      className="pointer-events-none absolute right-3.5 top-1/2 size-3.5 -translate-y-1/2 text-muted"
                      aria-hidden
                    />
                  </span>
                  <span id="card-note" className="text-xs text-muted">
                    Fixed to a public test number — you cannot enter a real card here.
                  </span>
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
                      Expiry
                    </span>
                    <input
                      readOnly
                      value="12 / 34"
                      className={`${FIELD} cursor-not-allowed opacity-70`}
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
                      CVC
                    </span>
                    <input
                      readOnly
                      value="•••"
                      className={`${FIELD} cursor-not-allowed opacity-70`}
                    />
                  </label>
                </div>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
                    Name on card
                  </span>
                  <input
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    placeholder="Alex Morgan"
                    className={FIELD}
                  />
                </label>
              </div>
            )}

            {method === "bank" && (
              <div className="flex flex-col gap-3.5">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
                    IBAN
                  </span>
                  <input
                    readOnly
                    value={DEMO_IBAN}
                    aria-describedby="iban-note"
                    className={`${FIELD} cursor-not-allowed tabular-nums opacity-70`}
                  />
                  <span id="iban-note" className="text-xs text-muted">
                    Placeholder IBAN — it belongs to no real account.
                  </span>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
                    Account holder
                  </span>
                  <input
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    placeholder="Alex Morgan"
                    className={FIELD}
                  />
                </label>
              </div>
            )}

            {method === "crypto" && (
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
                  Your {request.receiveCurrency} address
                </span>
                <input
                  value={payoutAddress}
                  onChange={(e) => setPayoutAddress(e.target.value)}
                  placeholder={`Where should we send the ${request.receiveCurrency}?`}
                  className={`${FIELD} font-mono text-xs`}
                />
                <span className="text-xs text-muted">
                  Not verified on-chain — this is a demo field.
                </span>
              </label>
            )}

            {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

            <button
              type="button"
              onClick={submit}
              className="gold-surface mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-base font-semibold text-black shadow-lg shadow-accent/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 active:translate-y-0"
            >
              Review order
              <ArrowRight className="size-4" aria-hidden />
            </button>
          </>
        );
      }}
    </CheckoutShell>
  );
}
