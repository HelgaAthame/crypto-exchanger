"use client";

import { useEffect } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Loader2, XCircle } from "lucide-react";
import { setStage } from "@/lib/history-store";
import { useRequest } from "@/lib/use-requests";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { useT } from "@/lib/i18n/context";
import type { ExchangeStage } from "@/types/exchange-request";

const STAGES: { id: ExchangeStage; label: string; body: string }[] = [
  {
    id: "awaiting-payment",
    label: "Awaiting payment",
    body: "Waiting for the payment to clear.",
  },
  {
    id: "payment-received",
    label: "Payment received",
    body: "Funds confirmed on our side.",
  },
  { id: "exchanging", label: "Exchanging", body: "Converting at the locked rate." },
  { id: "sending", label: "Sending", body: "Transferring to your destination." },
  { id: "completed", label: "Completed", body: "The simulated exchange is done." },
];

/** How long each stage lingers before the next one, in ms. */
const STAGE_DURATION_MS = 3500;

function stageIndex(stage: ExchangeStage | undefined): number {
  if (!stage) return 0;
  return STAGES.findIndex((s) => s.id === stage);
}

function formatAmount(value: number): string {
  if (value >= 1000) return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (value >= 1) return value.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
  return value.toFixed(8).replace(/0+$/, "").replace(/\.$/, "");
}

export default function ExchangeStatusPage() {
  const t = useT();
  const params = useParams<{ id: string }>();
  const request = useRequest(params.id);

  // Advance the simulated pipeline one stage at a time.
  useEffect(() => {
    if (!request || request.step !== "status") return;
    const current = stageIndex(request.stage);
    if (current >= STAGES.length - 1) return;

    const timer = window.setTimeout(() => {
      setStage(request.id, STAGES[current + 1].id);
    }, STAGE_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [request]);

  if (request === undefined) {
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

  // Reached the status URL without paying — send them back into the flow.
  if (request.step !== "status") {
    return (
      <PageContainer className="pt-16">
        <div className="surface-card rounded-3xl p-10 text-center">
          <p className="font-medium">{t("status.unpaid")}</p>
          <p className="mt-1.5 text-sm text-muted">{t("status.unpaidBody")}</p>
          <Link
            href={`/exchange/${request.id}/${request.step}`}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
          >
            {t("status.continue")}
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      </PageContainer>
    );
  }

  const activeIndex = stageIndex(request.stage);
  const isDone = request.stage === "completed";

  return (
    <PageContainer className="pb-20 pt-10">
      <Breadcrumbs
        items={[
          { label: t("nav.calculator"), href: "/" },
          { label: t("history.title"), href: "/history" },
          { label: t("status.title") },
        ]}
      />

      <Link
        href="/history"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        {t("history.allRequests")}
      </Link>

      <div className="surface-card rise-in mt-5 rounded-3xl p-6 sm:p-8">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-2xl font-semibold tabular-nums sm:text-3xl">
          <span>
            {formatAmount(request.giveAmount)}{" "}
            <span className="text-lg font-medium text-muted">{request.giveCurrency}</span>
          </span>
          <ArrowRight className="size-5 text-accent" aria-hidden />
          <span>
            <span className="gold-text">{formatAmount(request.receiveAmount)}</span>{" "}
            <span className="text-lg font-medium text-muted">{request.receiveCurrency}</span>
          </span>
        </div>

        <ol className="mt-7 flex flex-col" aria-live="polite">
          {STAGES.map((stage, i) => {
            const done = i < activeIndex;
            const active = i === activeIndex;
            return (
              <li key={stage.id} className="flex gap-3.5">
                <div className="flex flex-col items-center">
                  <span
                    className={`grid size-8 shrink-0 place-items-center rounded-full border transition-colors duration-500 ${
                      done
                        ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-500"
                        : active
                          ? "border-accent/50 bg-accent/15 text-accent"
                          : "border-border text-muted/50"
                    }`}
                  >
                    {done ? (
                      <Check className="size-4" aria-hidden />
                    ) : active && !isDone ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : (
                      <span className="text-xs tabular-nums">{i + 1}</span>
                    )}
                  </span>
                  {i < STAGES.length - 1 && (
                    <span
                      className={`my-1 w-px flex-1 transition-colors duration-500 ${
                        done ? "bg-emerald-500/40" : "bg-border"
                      }`}
                    />
                  )}
                </div>
                <div className={`pb-5 ${active ? "" : "opacity-70"}`}>
                  <p className="text-sm font-medium">{stage.label}</p>
                  <p className="mt-0.5 text-sm text-muted">{stage.body}</p>
                </div>
              </li>
            );
          })}
        </ol>

        <dl className="flex flex-col gap-2.5 border-t border-border/70 pt-5 text-sm">
          <Row
            label={t("status.rateAtCreation")}
            value={`1 ${request.giveCurrency} = ${formatAmount(request.rateAtCreation)} ${request.receiveCurrency}`}
          />
          <Row
            label={t("status.serviceFee")}
            value={`${formatAmount(request.feeAmount)} ${request.receiveCurrency}`}
          />
          <Row label={t("status.created")} value={new Date(request.createdAt).toLocaleString()} />
          <Row label={t("status.contact")} value={request.recipientContact} />
          {request.txHash && <Row label="Transaction (simulated)" value={request.txHash} mono />}
        </dl>

        {isDone && (
          <Link
            href="/"
            className="gold-surface sheen mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-base font-semibold text-black shadow-lg shadow-accent/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-accent/30 active:translate-y-0"
          >
            {t("status.another")}
          </Link>
        )}
      </div>
    </PageContainer>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className={`break-all text-right ${mono ? "font-mono text-xs" : ""}`}>{value}</dd>
    </div>
  );
}
