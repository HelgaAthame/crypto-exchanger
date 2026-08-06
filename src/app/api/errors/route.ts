import { NextRequest, NextResponse } from "next/server";
import { formatLogLine, normalizeReport } from "@/lib/monitoring/report";

/**
 * Receives what the browser could not tell us any other way.
 *
 * A client-side crash never reaches the server on its own: `error.tsx` shows
 * the visitor a message and the detail dies in their console. This endpoint is
 * the seam that turns those into log lines with the same shape as server-side
 * ones, so a log drain sees both.
 */

/** A crash loop should not be able to fill the log; per instance is enough. */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;
let windowStart = Date.now();
let countInWindow = 0;

function withinRateLimit(): boolean {
  const now = Date.now();
  if (now - windowStart > WINDOW_MS) {
    windowStart = now;
    countInWindow = 0;
  }
  countInWindow += 1;
  return countInWindow <= MAX_PER_WINDOW;
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  const report = normalizeReport({
    ...(body as Record<string, unknown>),
    userAgent: request.headers.get("user-agent") ?? undefined,
  });
  if (!report) return new NextResponse(null, { status: 400 });

  if (withinRateLimit()) {
    console.error(formatLogLine(report, new Date()));
  }

  // 204 either way: the browser has nothing useful to do with a failure here,
  // and telling it it was rate-limited would only invite a retry.
  return new NextResponse(null, { status: 204 });
}
