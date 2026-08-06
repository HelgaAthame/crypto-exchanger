import { siteUrl } from "@/lib/site";

export type OAuthProvider = "github" | "google";

type ProviderConfig = {
  id: OAuthProvider;
  label: string;
  authorizeUrl: string;
  tokenUrl: string;
  scope: string;
  clientId?: string;
  clientSecret?: string;
};

/**
 * Each provider is optional on its own: a deployment with only GitHub
 * credentials shows only the GitHub button, and one with neither shows none.
 * Nothing here throws for a missing key — the button simply does not appear.
 */
export function providerConfig(provider: OAuthProvider): ProviderConfig {
  if (provider === "github") {
    return {
      id: "github",
      label: "GitHub",
      authorizeUrl: "https://github.com/login/oauth/authorize",
      tokenUrl: "https://github.com/login/oauth/access_token",
      scope: "read:user user:email",
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    };
  }
  return {
    id: "google",
    label: "Google",
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scope: "openid email",
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  };
}

export function isProviderConfigured(provider: OAuthProvider): boolean {
  const config = providerConfig(provider);
  return Boolean(config.clientId && config.clientSecret);
}

export function configuredProviders(): OAuthProvider[] {
  return (["github", "google"] as const).filter(isProviderConfigured);
}

export function callbackUrl(provider: OAuthProvider): string {
  return `${siteUrl()}/api/auth/oauth/${provider}/callback`;
}

/**
 * Builds the URL the visitor is sent to.
 *
 * `state` is the CSRF defence: it is also written to a short-lived cookie and
 * compared on the way back, so a callback the visitor never initiated — the
 * classic login-CSRF, where an attacker gets you signed into *their* account —
 * is rejected.
 */
export function authorizeUrl(
  provider: OAuthProvider,
  state: string
): string | null {
  const config = providerConfig(provider);
  if (!config.clientId) return null;

  const url = new URL(config.authorizeUrl);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", callbackUrl(provider));
  url.searchParams.set("scope", config.scope);
  url.searchParams.set("state", state);
  if (provider === "google") {
    url.searchParams.set("response_type", "code");
    // Ask for the account chooser rather than silently reusing a session.
    url.searchParams.set("prompt", "select_account");
  }
  return url.toString();
}

/** Reads the email out of each provider's differently shaped response. */
export function emailFromProfile(
  provider: OAuthProvider,
  profile: unknown,
  emails?: unknown
): string | null {
  if (provider === "google") {
    const google = profile as { email?: string; email_verified?: boolean };
    // An unverified Google address could belong to anyone.
    if (!google?.email || google.email_verified === false) return null;
    return google.email.toLowerCase();
  }

  const github = profile as { email?: string | null };
  if (github?.email) return github.email.toLowerCase();

  // GitHub hides the address unless it is public, so the extra call to
  // /user/emails is the normal path, not the exception.
  const list = emails as { email: string; primary: boolean; verified: boolean }[] | undefined;
  const primary = list?.find((e) => e.primary && e.verified) ?? list?.find((e) => e.verified);
  return primary ? primary.email.toLowerCase() : null;
}
