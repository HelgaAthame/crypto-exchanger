import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Only needed for `db:push` / `db:generate`, never at runtime.
    url: process.env.DATABASE_URL ?? "",
  },
});
