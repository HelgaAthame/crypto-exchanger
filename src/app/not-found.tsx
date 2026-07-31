"use client";

import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import Image from "next/image";
import { ArrowLeft, History } from "lucide-react";
import { useT } from "@/lib/i18n/context";

export default function NotFound() {
  const t = useT();
  return (
    <PageContainer className="pb-20 pt-16 text-center">
      <div className="surface-card rise-in relative overflow-hidden rounded-3xl p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-accent/10 blur-3xl"
        />

        <Image
          src="/logo/logo-mark.png"
          alt=""
          width={56}
          height={56}
          className="relative mx-auto opacity-90"
        />

        <p className="relative mt-5 text-5xl font-semibold tracking-tight">
          <span className="gold-text">404</span>
        </p>
        <h1 className="relative mt-2 text-xl font-semibold tracking-tight">
          {t("notFound.title")}
        </h1>
        <p className="relative mx-auto mt-2 max-w-sm text-sm text-muted">
          {t("notFound.body")}
        </p>

        <div className="relative mt-6 flex flex-wrap items-center justify-center gap-2.5">
          <Link
            href="/"
            className="gold-surface sheen inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-black shadow-lg shadow-accent/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 active:translate-y-0"
          >
            <ArrowLeft className="size-4" aria-hidden />
            {t("status.backToCalculator")}
          </Link>
          <Link
            href="/history"
            className="sheen-border inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-medium transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 active:translate-y-0"
          >
            <History className="size-4" aria-hidden />
            {t("notFound.history")}
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
