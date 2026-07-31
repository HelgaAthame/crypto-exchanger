import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/lib/db/schema";

/**
 * The database is optional on purpose.
 *
 * Without `DATABASE_URL` the app keeps working exactly as it did before —
 * everything lives in `localStorage` — so a clone runs with an empty
 * environment and the deploy never breaks because a connection string is
 * missing. `isDatabaseConfigured` is what the API routes check before
 * answering, and the client falls back to local storage when they decline.
 *
 * Neon's HTTP driver is used rather than a pooled TCP connection: each
 * serverless invocation makes a stateless request, so there is no pool to
 * exhaust and no connection to leak between cold starts.
 */
export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

let cached: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set — check isDatabaseConfigured() first");
  }
  // Module scope survives warm invocations, so the client is built once.
  cached ??= drizzle(neon(url), { schema });
  return cached;
}
