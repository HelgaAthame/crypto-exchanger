import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { and, eq, gt, isNull } from "drizzle-orm";
import { getDb, isDatabaseConfigured } from "@/lib/db/client";
import {
  authSessions,
  exchangeRequests,
  limitOrders,
  rateAlerts,
  recurringPlans,
  users,
} from "@/lib/db/schema";
import { SESSION_COOKIE } from "@/lib/db/session";

export const AUTH_COOKIE = "ce_auth";
const SESSION_DAYS = 30;

/**
 * Only the hash of the token is stored. A leaked database therefore hands over
 * no usable session — the raw token exists solely in the visitor's cookie.
 */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export type AuthUser = { id: string; email: string };

/** Issues a fresh session and sets the cookie. */
export async function startSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);

  await getDb().insert(authSessions).values({
    tokenHash: hashToken(token),
    userId,
    expiresAt,
  });

  const store = await cookies();
  store.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function endSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(AUTH_COOKIE)?.value;

  if (token && isDatabaseConfigured()) {
    // Delete the row as well as the cookie, so a copied token dies too.
    await getDb().delete(authSessions).where(eq(authSessions.tokenHash, hashToken(token)));
  }
  store.delete(AUTH_COOKIE);
}

/** The signed-in user, or `null`. Expired sessions count as signed out. */
export async function getCurrentUser(): Promise<AuthUser | null> {
  if (!isDatabaseConfigured()) return null;

  const store = await cookies();
  const token = store.get(AUTH_COOKIE)?.value;
  if (!token) return null;

  const rows = await getDb()
    .select({ id: users.id, email: users.email })
    .from(authSessions)
    .innerJoin(users, eq(users.id, authSessions.userId))
    .where(
      and(
        eq(authSessions.tokenHash, hashToken(token)),
        gt(authSessions.expiresAt, new Date())
      )
    )
    .limit(1);

  return rows[0] ?? null;
}

/**
 * Attaches everything created before signing in to the account.
 *
 * Someone can use the whole demo anonymously and register afterwards; without
 * this their requests, alerts, orders and plans would silently stay behind.
 * Only unclaimed rows are taken, so signing in on a shared browser cannot
 * steal another account's records.
 */
export async function claimAnonymousRows(userId: string): Promise<void> {
  const store = await cookies();
  const anonymousId = store.get(SESSION_COOKIE)?.value;
  if (!anonymousId) return;

  const db = getDb();
  for (const table of [exchangeRequests, rateAlerts, limitOrders, recurringPlans]) {
    await db
      .update(table)
      .set({ userId })
      .where(and(eq(table.sessionId, anonymousId), isNull(table.userId)));
  }
}
