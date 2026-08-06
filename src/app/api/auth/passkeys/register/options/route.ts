import { NextResponse } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session";
import { relyingParty } from "@/lib/auth/passkeys";
import { saveChallenge } from "@/lib/auth/challenge-store";
import { getDb, isDatabaseConfigured } from "@/lib/db/client";
import { passkeys } from "@/lib/db/schema";

/**
 * A passkey is added to an existing account, so this requires a session. That
 * keeps the ceremony simple: there is no separate "who are you" step, and a
 * key can never be attached to an account the visitor cannot already reach.
 */
export async function POST() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "auth.unavailable" }, { status: 501 });
  }
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "auth.required" }, { status: 401 });

  const { rpID, rpName } = relyingParty();
  const existing = await getDb()
    .select({ id: passkeys.id })
    .from(passkeys)
    .where(eq(passkeys.userId, user.id));

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: user.email,
    // Stops the same authenticator registering twice on one account.
    excludeCredentials: existing.map((row) => ({ id: row.id })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
  });

  await saveChallenge(`reg:${user.id}`, options.challenge);
  return NextResponse.json(options);
}
