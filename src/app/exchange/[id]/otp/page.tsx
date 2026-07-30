"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Smartphone } from "lucide-react";
import { CheckoutShell } from "@/components/checkout/checkout-shell";
import { startProcessing } from "@/lib/history-store";

export default function OtpPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <CheckoutShell
      step="otp"
      title="Confirm your payment"
      subtitle="A simulated 3-D Secure check — no bank is contacted."
    >
      {(request) => (
        <>
          <div className="flex flex-col items-center rounded-2xl border border-border/70 p-6 text-center">
            <span className="grid size-12 place-items-center rounded-2xl border border-accent/30 bg-accent/10 text-accent">
              <Smartphone className="size-5" aria-hidden />
            </span>
            <p className="mt-4 text-sm">
              Enter the 6-digit code “sent” to the phone on file for card ••••{" "}
              {request.paymentDetails?.cardLast4 ?? "4242"}.
            </p>
            <p className="mt-1 text-xs text-muted">Any 6 digits will pass — this is a demo.</p>

            <input
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                setError(null);
              }}
              placeholder="••••••"
              aria-label="Verification code"
              className="mt-5 w-44 rounded-xl border border-border bg-background px-4 py-3 text-center text-2xl tracking-[0.35em] tabular-nums transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
            />

            {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
          </div>

          <button
            type="button"
            onClick={() => {
              if (code.length !== 6) {
                setError("Enter all 6 digits");
                return;
              }
              startProcessing(request.id);
              router.push(`/exchange/${request.id}`);
            }}
            className="gold-surface mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-base font-semibold text-black shadow-lg shadow-accent/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 active:translate-y-0"
          >
            <ShieldCheck className="size-4" aria-hidden />
            Verify and pay
          </button>
        </>
      )}
    </CheckoutShell>
  );
}
