"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, ShieldAlert, XCircle } from "lucide-react";
import { resolveStepAccess } from "@/lib/checkout-flow";
import { useRequest } from "@/lib/use-requests";
import { StepProgress } from "@/components/checkout/step-progress";
import { Breadcrumbs } from "@/components/breadcrumbs";
import type { ExchangeRequest, ExchangeStep } from "@/types/exchange-request";

const STEP_PATH: Record<ExchangeStep, string> = {
  method: "method",
  details: "details",
  confirm: "confirm",
  otp: "otp",
  deposit: "deposit",
  status: "",
};

type Props = {
  step: ExchangeStep;
  title: string;
  subtitle?: string;
  children: (request: ExchangeRequest) => React.ReactNode;
};

/**
 * Loads the request, enforces step order, and renders the shared checkout
 * chrome. Requests live in localStorage, so this has to run on the client.
 */
export function CheckoutShell({ step, title, subtitle, children }: Props) {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const request = useRequest(params.id);

  const access = request
    ? resolveStepAccess(step, request.step, request.paymentMethod)
    : null;
  const redirectTo = access && !access.allowed ? access.redirectTo : null;

  useEffect(() => {
    if (!redirectTo) return;
    const path = STEP_PATH[redirectTo];
    router.replace(`/exchange/${params.id}${path ? `/${path}` : ""}`);
  }, [params.id, redirectTo, router]);

  if (request === undefined || redirectTo) {
    return (
      <div className="mx-auto flex max-w-xl items-center gap-2 px-5 py-16 text-sm text-muted">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Loading request…
      </div>
    );
  }

  if (request === null) {
    return (
      <div className="mx-auto w-full max-w-xl px-5 pt-16">
        <div className="surface-card rounded-3xl p-10 text-center">
          <XCircle className="mx-auto size-8 text-muted" aria-hidden />
          <p className="mt-4 font-medium">Request not found</p>
          <p className="mt-1.5 text-sm text-muted">
            It may have been created in a different browser.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Back to calculator
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl px-5 pb-20 pt-10">
      <Breadcrumbs
        items={[
          { label: "Calculator", href: "/" },
          { label: "History", href: "/history" },
          { label: "Request", href: `/exchange/${request.id}` },
          { label: title },
        ]}
      />

      <StepProgress
        requestId={request.id}
        current={step}
        reached={request.step}
        method={request.paymentMethod}
      />

      <div className="surface-card rise-in rounded-3xl p-6 sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-muted">{subtitle}</p>}

        <div className="mt-6">{children(request)}</div>

        <p className="mt-6 flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
          <ShieldAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          Demo checkout — no real payment is processed, no payment provider is contacted, and
          nothing you enter leaves this browser.
        </p>
      </div>
    </div>
  );
}
