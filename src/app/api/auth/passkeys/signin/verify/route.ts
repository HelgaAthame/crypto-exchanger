import { NextRequest, NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { relyingParty } from "@/lib/auth/passkeys";
import { takeChallenge } from "@/lib/auth/challenge-store";
import { claimAnonymousRows, startSession } from "@/lib/auth/session";
import { getDb, isDatabaseConfigured } from "@/lib/db/client";
import { passkeys, users } from "@/lib/db/schema";
import { PASSKEY_CEREMONY_COOKIE } from "../options/route";

export async function POST(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "auth.unavailable" }, { status: 501 });
  }

  const store = await cookies();
  const ceremony = store.get(PASSKEY_CEREMONY_COOKIE)?.value;
  store.delete(PASSKEY_CEREMONY_COOKIE);
  if (!ceremony) {
    return NextResponse.json({ error: "auth.challengeExpired" }, { status: 400 });
  }

  const expectedChallenge = await takeChallenge(`auth:${ceremony}`);
  if (!expectedChallenge) {
    return NextResponse.json({ error: "auth.challengeExpired" }, { status: 400 });
  }

  const body = (await request.json()) as { id?: string };
  if (!body?.id) return NextResponse.json({ error: "auth.passkeyRejected" }, { status: 400 });

  const db = getDb();
  const rows = await db
    .select()
    .from(passkeys)
    .where(eq(passkeys.id, body.id))
    .limit(1);
  const stored = rows[0];
  if (!stored) return NextResponse.json({ error: "auth.passkeyUnknown" }, { status: 401 });

  const { rpID, origin } = relyingParty();
  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: body as Parameters<typeof verifyAuthenticationResponse>[0]["response"],
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: stored.id,
        publicKey: new Uint8Array(Buffer.from(stored.publicKey, "base64")),
        counter: stored.counter,
        transports: stored.transports
          ? (stored.transports.split(",") as never)
          : undefined,
      },
    });
  } catch {
    return NextResponse.json({ error: "auth.passkeyRejected" }, { status: 401 });
  }

  if (!verification.verified) {
    return NextResponse.json({ error: "auth.passkeyRejected" }, { status: 401 });
  }

  // The counter only ever goes up. A repeat or lower value means the response
  // was replayed, or the credential was cloned.
  await db
    .update(passkeys)
    .set({ counter: verification.authenticationInfo.newCounter, lastUsedAt: new Date() })
    .where(eq(passkeys.id, stored.id));

  const account = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.id, stored.userId))
    .limit(1);
  if (!account[0]) {
    return NextResponse.json({ error: "auth.passkeyUnknown" }, { status: 401 });
  }

  await startSession(account[0].id);
  await claimAnonymousRows(account[0].id);
  return NextResponse.json({ user: account[0] });
}
