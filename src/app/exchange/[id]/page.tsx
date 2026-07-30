"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { getRequestById } from "@/lib/history-store";
import type { ExchangeRequest } from "@/types/exchange-request";

const STATUS_STYLE: Record<ExchangeRequest["status"], string> = {
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  completed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  cancelled: "border-border bg-card text-muted",
};

function formatAmount(value: number): string {
  if (value >= 1000) return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (value >= 1) return value.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
  return value.toFixed(8).replace(/0+$/, "").replace(/\.$/, "");
}

export default function ExchangeDetailsPage() {
  const params = useParams<{ id: string }>();
  const [request, setRequest] = useState<ExchangeRequest | null | undefined>(undefined);

  useEffect(() => {
    function load() {
      setRequest(getRequestById(params.id) ?? null);
    }
    load();
    const interval = window.setInterval(load, 2000);
    return () => window.clearInterval(interval);
  }, [params.id]);

  if (request === undefined) {
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
        <div className="rounded-3xl border border-border bg-card p-10 text-center">
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

  const StatusIcon = request.status === "completed" ? CheckCircle2 : Loader2;

  return (
    <div className="mx-auto w-full max-w-xl px-5 pb-20 pt-12">
      <Link
        href="/history"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        All requests
      </Link>

      <div className="mt-5 rounded-3xl border border-border bg-card p-6 shadow-2xl shadow-black/5 sm:p-8 dark:shadow-black/40">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium capitalize ${STATUS_STYLE[request.status]}`}
        >
          <StatusIcon
            className={`size-3.5 ${request.status === "pending" ? "animate-spin" : ""}`}
            aria-hidden
          />
          {request.status}
        </span>

        <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-2xl font-semibold tabular-nums sm:text-3xl">
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

        <p className="mt-2 text-sm text-muted">
          {request.status === "pending"
            ? "Simulated processing — this will move to completed shortly."
            : "Demo request — no real funds were transferred."}
        </p>

        <dl className="mt-6 flex flex-col gap-2.5 border-t border-border/70 pt-5 text-sm">
          <Row label="Fee" value={`${formatAmount(request.feeAmount)} ${request.receiveCurrency}`} />
          <Row
            label="Rate at creation"
            value={`1 ${request.giveCurrency} = ${formatAmount(request.rateAtCreation)} ${request.receiveCurrency}`}
          />
          <Row label="Created" value={new Date(request.createdAt).toLocaleString()} />
          <Row label="Contact" value={request.recipientContact} />
          <Row label="Request ID" value={request.id} mono />
        </dl>
      </div>
    </div>
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
