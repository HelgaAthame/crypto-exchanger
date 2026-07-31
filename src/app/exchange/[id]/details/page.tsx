"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock } from "lucide-react";
import { CheckoutShell } from "@/components/checkout/checkout-shell";
import { useT } from "@/lib/i18n/context";
import { nextStep } from "@/lib/checkout-flow";
import { setPaymentDetails, setStep } from "@/lib/history-store";
import type { PaymentDetails } from "@/types/exchange-request";

/** Widely published test card number — deliberately not a usable card. */
const DEMO_CARD = "4242 4242 4242 4242";
const DEMO_IBAN = "DE00 0000 0000 0000 0000 00";

const FIELD =
  "w-full rounded-xl border border-control-border bg-background px-4 py-3 text-sm transition-colors hover:border-accent/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25";

export default function DetailsPage() {
  const t = useT();
  const router = useRouter();
  const [cardHolder, setCardHolder] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [payoutAddress, setPayoutAddress] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <CheckoutShell
      step="details"
      title={t("details.title")}
      subtitle={t("details.subtitle")}
    >
      {(request) => {
        const method = request.paymentMethod;

        function submit() {
          setError(null);
          let details: PaymentDetails;

          if (method === "card") {
            if (!cardHolder.trim()) {
              setError(t("details.errorCard"));
              return;
            }
            details = { cardHolder: cardHolder.trim(), cardLast4: "4242" };
          } else if (method === "bank") {
            if (!accountHolder.trim()) {
              setError(t("details.errorAccount"));
              return;
            }
            details = { accountHolder: accountHolder.trim(), iban: DEMO_IBAN };
          } else {
            if (!payoutAddress.trim()) {
              setError(t("details.errorAddress"));
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
                    {t("details.cardNumber")}
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
                    {t("details.cardNote")}
                  </span>
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
                      {t("details.expiry")}
                    </span>
                    <input
                      readOnly
                      value="12 / 34"
                      className={`${FIELD} cursor-not-allowed opacity-70`}
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
                      {t("details.cvc")}
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
                    {t("details.nameOnCard")}
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
                    {t("details.iban")}
                  </span>
                  <input
                    readOnly
                    value={DEMO_IBAN}
                    aria-describedby="iban-note"
                    className={`${FIELD} cursor-not-allowed tabular-nums opacity-70`}
                  />
                  <span id="iban-note" className="text-xs text-muted">
                    {t("details.ibanNote")}
                  </span>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
                    {t("details.accountHolder")}
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
                  {t("details.address", { code: request.receiveCurrency })}
                </span>
                <input
                  value={payoutAddress}
                  onChange={(e) => setPayoutAddress(e.target.value)}
                  placeholder={t("details.addressPlaceholder", {
                    code: request.receiveCurrency,
                  })}
                  className={`${FIELD} font-mono text-xs`}
                />
                <span className="text-xs text-muted">
                  {t("details.addressNote")}
                </span>
              </label>
            )}

            {error && (
              <p id="details-error" role="alert" className="mt-3 text-sm text-danger">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={submit}
              className="gold-surface sheen mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-base font-semibold text-black shadow-lg shadow-accent/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 active:translate-y-0"
            >
              {t("details.review")}
              <ArrowRight className="size-4" aria-hidden />
            </button>
          </>
        );
      }}
    </CheckoutShell>
  );
}
