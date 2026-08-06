import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      // Every pure domain module. Browser- and network-bound code
      // (history-store, rates/*, use-requests) is deliberately excluded.
      include: [
        "src/lib/exchange-calc.ts",
        "src/lib/currencies.ts",
        "src/lib/checkout-flow.ts",
        "src/lib/operations.ts",
        "src/lib/rate-history.ts",
        "src/lib/alerts.ts",
        "src/lib/i18n/translate.ts",
        "src/lib/recurring.ts",
        "src/lib/limit-orders.ts",
        "src/lib/auth/credentials.ts",
        "src/lib/auth/password.ts",
        "src/lib/monitoring/report.ts",
        "src/lib/scheduler.ts",
        "src/lib/auth/passkeys.ts",
      ],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
});
