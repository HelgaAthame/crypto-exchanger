import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { normalizeEmail, validateCredentials } from "@/lib/auth/credentials";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { claimAnonymousRows, startSession } from "@/lib/auth/session";
import { getDb, isDatabaseConfigured } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

const bodySchema = z.object({
  email: z.string().max(320),
  password: z.string().max(500),
  mode: z.enum(["sign-in", "sign-up"]),
});

/**
 * A hash to compare against when the email is unknown.
 *
 * Without it, a missing account returns far faster than a wrong password, and
 * that difference alone tells an attacker which addresses are registered.
 */
const DUMMY_HASH_PROMISE = hashPassword("password-that-is-never-correct");

export async function POST(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "auth.unavailable" }, { status: 501 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "auth.invalid" }, { status: 400 });
  }

  const { password, mode } = parsed.data;
  const email = normalizeEmail(parsed.data.email);

  const check = validateCredentials({ email, password });
  if (!check.valid) {
    const issue = check.issues[0];
    return NextResponse.json(
      { error: `auth.${issue.code}`, params: issue.params },
      { status: 400 }
    );
  }

  const db = getDb();
  const existing = await db
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (mode === "sign-up") {
    if (existing.length > 0) {
      return NextResponse.json({ error: "auth.emailTaken" }, { status: 409 });
    }
    const id = crypto.randomUUID();
    await db.insert(users).values({ id, email, passwordHash: await hashPassword(password) });
    await startSession(id);
    await claimAnonymousRows(id);
    return NextResponse.json({ user: { id, email } });
  }

  const account = existing[0];
  // Verify either way, so a wrong password and an unknown address take the
  // same time and the response cannot be used to enumerate accounts.
  const ok = account
    ? await verifyPassword(password, account.passwordHash)
    : await verifyPassword(password, await DUMMY_HASH_PROMISE);

  if (!account || !ok) {
    return NextResponse.json({ error: "auth.badCredentials" }, { status: 401 });
  }

  await startSession(account.id);
  await claimAnonymousRows(account.id);
  return NextResponse.json({ user: { id: account.id, email } });
}
