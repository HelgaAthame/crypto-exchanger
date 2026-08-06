import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authorizeUrl, isProviderConfigured, type OAuthProvider } from "@/lib/auth/oauth";

export const OAUTH_STATE_COOKIE = "ce_oauth_state";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  if (provider !== "github" && provider !== "google") {
    return NextResponse.redirect(new URL("/login?error=auth.unknownProvider", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"));
  }
  if (!isProviderConfigured(provider as OAuthProvider)) {
    return NextResponse.json({ error: "auth.providerUnavailable" }, { status: 501 });
  }

  // One-shot value, echoed back by the provider and compared on return.
  const state = randomBytes(16).toString("hex");
  const store = await cookies();
  store.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });

  const url = authorizeUrl(provider as OAuthProvider, state);
  if (!url) return NextResponse.json({ error: "auth.providerUnavailable" }, { status: 501 });
  return NextResponse.redirect(url);
}
