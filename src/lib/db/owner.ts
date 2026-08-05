import { and, eq, isNull, or, type SQL } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { getCurrentUser } from "@/lib/auth/session";
import { getSessionId } from "@/lib/db/session";

export type Owner = { sessionId: string; userId: string | null };

export async function resolveOwner(): Promise<Owner> {
  const user = await getCurrentUser();
  return { sessionId: await getSessionId(), userId: user?.id ?? null };
}

/**
 * Which rows belong to the caller.
 *
 * Signed in, that is everything on the account **plus** anything still tagged
 * only with this browser's session — the rows created in the moments before
 * `claimAnonymousRows` runs, and any created in another tab that has not been
 * claimed yet. Signed out, it is this browser's unclaimed rows only, so
 * logging out does not expose the account's records to the next person.
 */
export function ownerFilter(
  owner: Owner,
  columns: { sessionId: PgColumn; userId: PgColumn }
): SQL | undefined {
  if (owner.userId) {
    return or(
      eq(columns.userId, owner.userId),
      and(eq(columns.sessionId, owner.sessionId), isNull(columns.userId))
    );
  }
  return and(eq(columns.sessionId, owner.sessionId), isNull(columns.userId));
}
