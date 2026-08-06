import { siteUrl } from "@/lib/site";

/**
 * WebAuthn binds a credential to an origin, so these two have to be exactly
 * right or every ceremony fails with an opaque error.
 *
 * `rpID` is the bare hostname — no scheme, no port. `origin` is the full
 * origin including both. A passkey registered on one origin cannot be used on
 * another, which is the property that makes it unphishable, and also the
 * reason a preview deployment cannot reuse production's keys.
 */
export function relyingParty(): { rpID: string; origin: string; rpName: string } {
  const origin = siteUrl();
  return {
    rpID: new URL(origin).hostname,
    origin,
    rpName: "Crypto Exchanger",
  };
}

/** How long an issued challenge stays valid. Long enough for a fingerprint. */
export const CHALLENGE_TTL_MS = 5 * 60_000;

/**
 * Turns whatever the browser reports into something readable in a list.
 *
 * The user agent is the only hint available at registration, and it is a poor
 * one — so this stays deliberately coarse rather than pretending to identify
 * the device.
 */
export function describeAuthenticator(userAgent: string | null): string {
  if (!userAgent) return "Passkey";
  const ua = userAgent.toLowerCase();
  if (ua.includes("iphone") || ua.includes("ipad")) return "iOS device";
  if (ua.includes("android")) return "Android device";
  if (ua.includes("mac os") || ua.includes("macintosh")) return "Mac";
  if (ua.includes("windows")) return "Windows device";
  if (ua.includes("linux")) return "Linux device";
  return "Passkey";
}
