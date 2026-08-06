export type ErrorReport = {
  message: string;
  /** Next's error digest, which ties a client report to the server render. */
  digest?: string;
  stack?: string;
  url?: string;
  userAgent?: string;
  source: "client" | "server";
};

/** Anything longer is noise in a log line, and a lever for filling the log. */
const MAX_MESSAGE = 500;
const MAX_STACK = 4000;

function clamp(value: string, limit: number): string {
  return value.length > limit ? `${value.slice(0, limit)}…` : value;
}

/**
 * Strips the things that should never reach a log.
 *
 * Stack frames and URLs carry query strings, and this app puts a currency pair
 * and an amount there — harmless — but also, on the login page, whatever the
 * visitor was redirected from. A password never appears in a URL here, yet a
 * report pipeline is exactly the place where that assumption quietly stops
 * being true, so tokens and anything password-shaped are removed by pattern.
 */
export function redact(value: string): string {
  return value
    .replace(/([?&](token|password|secret|key|session)=)[^&\s]*/gi, "$1[redacted]")
    .replace(/(Bearer\s+)[A-Za-z0-9._-]+/gi, "$1[redacted]")
    .replace(/\b[A-Za-z0-9._-]*@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, "[email]");
}

export function normalizeReport(input: Partial<ErrorReport>): ErrorReport | null {
  const message = typeof input.message === "string" ? input.message.trim() : "";
  // A report with no message says nothing and cannot be grouped.
  if (message.length === 0) return null;

  return {
    message: clamp(redact(message), MAX_MESSAGE),
    digest: input.digest ? clamp(input.digest, 64) : undefined,
    stack: input.stack ? clamp(redact(input.stack), MAX_STACK) : undefined,
    url: input.url ? clamp(redact(input.url), 500) : undefined,
    userAgent: input.userAgent ? clamp(input.userAgent, 300) : undefined,
    source: input.source === "server" ? "server" : "client",
  };
}

/**
 * One line of JSON per error.
 *
 * Structured rather than prose so a log drain can filter on it later, and
 * `console.error` rather than an SDK so this works on a bare deployment with
 * no account to configure. Sending the same object to Sentry or similar is a
 * change to this function alone.
 */
export function formatLogLine(report: ErrorReport, at: Date): string {
  return JSON.stringify({
    level: "error",
    event: "app_error",
    at: at.toISOString(),
    ...report,
  });
}
