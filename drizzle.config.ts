import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

/**
 * Next.js loads `.env.local` itself, but drizzle-kit is a standalone CLI and
 * does not — so without this, `db:push` reports an empty url even when the app
 * connects fine.
 */
for (const file of [".env.local", ".env"]) {
  if (existsSync(file)) {
    process.loadEnvFile(file);
    break;
  }
}

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Only needed for `db:push` / `db:generate`, never at runtime.
    url: process.env.DATABASE_URL ?? "",
  },
});
