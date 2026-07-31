"use client";

import { useEffect } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, ShieldAlert, XCircle } from "lucide-react";
import { resolveStepAccess } from "@/lib/checkout-flow";
import { useRequest } from "@/lib/use-requests";
import { StepProgress } from "@/components/checkout/step-progress";
import { OrderSummary } from "@/components/checkout/order-summary";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { useT } from "@/lib/i18n/context";
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
  const t = useT();
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
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-16 sm:px-6 lg:px-8 text-sm text-muted">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        {t("status.loading")}
      </div>
    );
  }

  if (request === null) {
    return (
      <PageContainer className="pt-16">
        <div className="surface-card rounded-3xl p-10 text-center">
          <XCircle className="mx-auto size-8 text-muted" aria-hidden />
          <p className="mt-4 font-medium">{t("status.notFound")}</p>
          <p className="mt-1.5 text-sm text-muted">
            {t("status.notFoundBody")}
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            {t("status.backToCalculator")}
          </Link>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="pb-20 pt-10">
      <Breadcrumbs
        items={[
          { label: t("nav.calculator"), href: "/" },
          { label: t("history.title"), href: "/history" },
          { label: t("status.title"), href: `/exchange/${request.id}` },
          { label: title },
        ]}
      />

      <StepProgress
        requestId={request.id}
        current={step}
        reached={request.step}
        method={request.paymentMethod}
      />

      {/* Two columns from lg: the step on the left, a standing order summary on
          the right, which is what fills the width instead of blank margin. */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="surface-card rise-in rounded-3xl p-6 sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1.5 max-w-prose text-sm text-muted">{subtitle}</p>}

          <div className="mt-6">{children(request)}</div>

          <p className="mt-6 flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
            <ShieldAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            {t("checkout.demoNotice")}
          </p>
        </div>

        <OrderSummary request={request} />
      </div>
    </PageContainer>
  );
}
