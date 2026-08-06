import type { Instrumentation } from "next";
import { formatLogLine, normalizeReport } from "@/lib/monitoring/report";

/**
 * Next calls this for every error thrown while rendering or handling a
 * request, which is the one hook that sees server errors the app never
 * catches itself. Reporting them in the same shape as client reports means a
 * single filter finds both.
 */
export const onRequestError: Instrumentation.onRequestError = (error, request) => {
  const cause = error as { message?: string; stack?: string; digest?: string };
  const report = normalizeReport({
    message: cause?.message ?? String(error),
    stack: cause?.stack,
    digest: cause?.digest,
    url: request.path,
    source: "server",
  });
  if (report) console.error(formatLogLine(report, new Date()));
};
