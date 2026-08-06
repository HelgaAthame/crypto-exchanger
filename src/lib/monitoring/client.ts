"use client";

import type { ErrorReport } from "@/lib/monitoring/report";

/**
 * Sends a client-side crash to the server, once.
 *
 * Error boundaries can re-render, and a broken page often throws repeatedly —
 * without the guard a single fault becomes a stream of identical reports.
 */
const alreadySent = new Set<string>();

export function reportClientError(
  error: Error & { digest?: string },
  extra?: Partial<ErrorReport>
): void {
  if (typeof window === "undefined") return;

  const key = `${error.digest ?? ""}|${error.message}`;
  if (alreadySent.has(key)) return;
  alreadySent.add(key);

  const body: Partial<ErrorReport> = {
    message: error.message,
    digest: error.digest,
    stack: error.stack,
    url: window.location.href,
    source: "client",
    ...extra,
  };

  // keepalive so the report survives the navigation that often follows a crash.
  void fetch("/api/errors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => {
    // Reporting must never be the thing that breaks the error screen.
  });
}
