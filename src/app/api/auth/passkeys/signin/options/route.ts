import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { relyingParty } from "@/lib/auth/passkeys";
import { saveChallenge } from "@/lib/auth/challenge-store";
import { isDatabaseConfigured } from "@/lib/db/client";

export const PASSKEY_CEREMONY_COOKIE = "ce_passkey_ceremony";

/**
 * Signing in does not name an account first.
 *
 * With no `allowCredentials` the browser offers whichever passkey it holds for
 * this site, and the credential it returns identifies the user — so the login
 * form never has to ask who you are, and an attacker learns nothing about
 * which accounts exist.
 */
export async function POST() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "auth.unavailable" }, { status: 501 });
  }

  const { rpID } = relyingParty();
  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: "preferred",
  });

  // Nobody is signed in yet, so the challenge is keyed to a one-off id.
  const ceremony = randomBytes(16).toString("hex");
  await saveChallenge(`auth:${ceremony}`, options.challenge);

  const store = await cookies();
  store.set(PASSKEY_CEREMONY_COOKIE, ceremony, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 300,
  });

  return NextResponse.json(options);
}
