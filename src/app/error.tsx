"use client";

import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import { ArrowLeft, RotateCcw, TriangleAlert } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PageContainer className="pb-20 pt-16 text-center">
      <div className="surface-card rise-in relative overflow-hidden rounded-3xl p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-red-500/10 blur-3xl"
        />

        <span className="relative mx-auto grid size-12 place-items-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-500">
          <TriangleAlert className="size-5" aria-hidden />
        </span>

        <h1 className="relative mt-5 text-xl font-semibold tracking-tight">
          Something went wrong
        </h1>
        <p className="relative mx-auto mt-2 max-w-sm text-sm text-muted">
          The page hit an unexpected error. Live rates come from third-party APIs, so this is
          often a temporary network or rate-limit hiccup — retrying usually works.
        </p>

        {error.digest && (
          <p className="relative mt-3 font-mono text-xs text-muted">
            Reference: {error.digest}
          </p>
        )}

        <div className="relative mt-6 flex flex-wrap items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={reset}
            className="gold-surface inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-black shadow-lg shadow-accent/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 active:translate-y-0"
          >
            <RotateCcw className="size-4" aria-hidden />
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-medium transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 active:translate-y-0"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back to calculator
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
