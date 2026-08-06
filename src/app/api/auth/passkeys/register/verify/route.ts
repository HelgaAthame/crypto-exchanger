import { NextRequest, NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { getCurrentUser } from "@/lib/auth/session";
import { describeAuthenticator, relyingParty } from "@/lib/auth/passkeys";
import { takeChallenge } from "@/lib/auth/challenge-store";
import { getDb, isDatabaseConfigured } from "@/lib/db/client";
import { passkeys } from "@/lib/db/schema";

export async function POST(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "auth.unavailable" }, { status: 501 });
  }
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "auth.required" }, { status: 401 });

  const expectedChallenge = await takeChallenge(`reg:${user.id}`);
  if (!expectedChallenge) {
    return NextResponse.json({ error: "auth.challengeExpired" }, { status: 400 });
  }

  const { rpID, origin } = relyingParty();
  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: await request.json(),
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });
  } catch {
    return NextResponse.json({ error: "auth.passkeyRejected" }, { status: 400 });
  }

  if (!verification.verified || !verification.registrationInfo) {
    return NextResponse.json({ error: "auth.passkeyRejected" }, { status: 400 });
  }

  const { credential } = verification.registrationInfo;
  await getDb().insert(passkeys).values({
    id: credential.id,
    userId: user.id,
    // Base64 so the key survives a text column unchanged.
    publicKey: Buffer.from(credential.publicKey).toString("base64"),
    counter: credential.counter,
    transports: credential.transports?.join(",") ?? null,
    label: describeAuthenticator(request.headers.get("user-agent")),
  });

  return NextResponse.json({ ok: true });
}
