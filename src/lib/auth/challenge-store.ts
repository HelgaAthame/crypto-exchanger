import { and, eq, gt } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { webauthnChallenges } from "@/lib/db/schema";
import { CHALLENGE_TTL_MS } from "@/lib/auth/passkeys";

/**
 * Challenges live in the database rather than a cookie or memory.
 *
 * A cookie would be visible to the client, and serverless instances do not
 * share memory — the request that issues a challenge is rarely the one that
 * verifies it. One row per key, overwritten on each new ceremony, so a stale
 * challenge cannot be reused.
 */
export async function saveChallenge(key: string, challenge: string): Promise<void> {
  const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS);
  await getDb()
    .insert(webauthnChallenges)
    .values({ key, challenge, expiresAt })
    .onConflictDoUpdate({
      target: webauthnChallenges.key,
      set: { challenge, expiresAt },
    });
}

/**
 * Reads a challenge and deletes it in the same breath. One use only: a
 * challenge that survived verification could be replayed.
 */
export async function takeChallenge(key: string): Promise<string | null> {
  const db = getDb();
  const rows = await db
    .select({ challenge: webauthnChallenges.challenge })
    .from(webauthnChallenges)
    .where(
      and(eq(webauthnChallenges.key, key), gt(webauthnChallenges.expiresAt, new Date()))
    )
    .limit(1);

  await db.delete(webauthnChallenges).where(eq(webauthnChallenges.key, key));
  return rows[0]?.challenge ?? null;
}
