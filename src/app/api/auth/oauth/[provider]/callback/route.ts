import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import {
  callbackUrl,
  emailFromProfile,
  isProviderConfigured,
  providerConfig,
  type OAuthProvider,
} from "@/lib/auth/oauth";
import { hashPassword } from "@/lib/auth/password";
import { claimAnonymousRows, startSession } from "@/lib/auth/session";
import { getDb, isDatabaseConfigured } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { siteUrl } from "@/lib/site";
import { OAUTH_STATE_COOKIE } from "../start/route";

function backToLogin(error: string) {
  return NextResponse.redirect(`${siteUrl()}/login?error=${encodeURIComponent(error)}`);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider: raw } = await params;
  if (raw !== "github" && raw !== "google") return backToLogin("auth.unknownProvider");
  const provider = raw as OAuthProvider;

  if (!isDatabaseConfigured() || !isProviderConfigured(provider)) {
    return backToLogin("auth.providerUnavailable");
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const store = await cookies();
  const expected = store.get(OAUTH_STATE_COOKIE)?.value;
  store.delete(OAUTH_STATE_COOKIE);

  // Reject a callback this browser never started: otherwise an attacker can
  // walk someone into signing in as *them*, which is login CSRF.
  if (!code || !state || !expected || state !== expected) {
    return backToLogin("auth.stateMismatch");
  }

  const config = providerConfig(provider);

  const tokenResponse = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: callbackUrl(provider),
      grant_type: "authorization_code",
    }),
  });
  if (!tokenResponse.ok) return backToLogin("auth.exchangeFailed");

  const token = (await tokenResponse.json()) as {
    access_token?: string;
    id_token?: string;
  };
  if (!token.access_token) return backToLogin("auth.exchangeFailed");

  let email: string | null = null;

  if (provider === "google") {
    const profile = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });
    if (!profile.ok) return backToLogin("auth.profileFailed");
    email = emailFromProfile(provider, await profile.json());
  } else {
    const headers = {
      Authorization: `Bearer ${token.access_token}`,
      Accept: "application/vnd.github+json",
    };
    const profile = await fetch("https://api.github.com/user", { headers });
    if (!profile.ok) return backToLogin("auth.profileFailed");

    // GitHub only puts an address on the profile when it is public.
    const emails = await fetch("https://api.github.com/user/emails", { headers });
    email = emailFromProfile(
      provider,
      await profile.json(),
      emails.ok ? await emails.json() : undefined
    );
  }

  if (!email) return backToLogin("auth.noEmail");

  const db = getDb();
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  let userId = existing[0]?.id;
  if (!userId) {
    userId = crypto.randomUUID();
    // An account created this way has no usable password: the column is not
    // nullable, and storing a random unguessable value is safer than an empty
    // string, which some future comparison might treat as a match.
    await db.insert(users).values({
      id: userId,
      email,
      passwordHash: await hashPassword(crypto.randomUUID()),
    });
  }

  await startSession(userId);
  await claimAnonymousRows(userId);
  return NextResponse.redirect(`${siteUrl()}/history`);
}
