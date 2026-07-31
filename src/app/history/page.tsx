"use client";

import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import { ArrowRight, Clock, History as HistoryIcon } from "lucide-react";
import { useAllRequests } from "@/lib/use-requests";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { useT } from "@/lib/i18n/context";
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

export default function HistoryPage() {
  const t = useT();
  const requests = useAllRequests() ?? [];

  return (
    <PageContainer className="pb-20 pt-12">
      <Breadcrumbs items={[{ label: t("nav.calculator"), href: "/" }, { label: t("history.title") }]} />

      <div className="mb-7">
        <h1 className="text-3xl font-semibold tracking-tight">{t("history.title")}</h1>
        <p className="mt-2 max-w-prose text-sm text-muted">
          {t("history.subtitle")}
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-10 text-center">
          <HistoryIcon className="mx-auto size-8 text-accent/60" aria-hidden />
          <p className="mt-4 text-sm text-muted">{t("history.empty")}</p>
          <Link
            href="/"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
          >
            {t("history.create")}
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {requests.map((r) => (
            <li key={r.id}>
              <Link
                href={`/exchange/${r.id}${r.step === "status" ? "" : `/${r.step}`}`}
                className="group block rounded-2xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-lg"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="flex flex-wrap items-baseline gap-1.5 text-sm font-medium tabular-nums">
                    {formatAmount(r.giveAmount)} {r.giveCurrency}
                    <ArrowRight className="size-3.5 text-accent" aria-hidden />
                    <span className="gold-text">{formatAmount(r.receiveAmount)}</span>{" "}
                    {r.receiveCurrency}
                  </span>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize ${STATUS_STYLE[r.status]}`}
                  >
                    {r.status}
                  </span>
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
                  <Clock className="size-3" aria-hidden />
                  {new Date(r.createdAt).toLocaleString()}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}
