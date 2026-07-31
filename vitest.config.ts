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
