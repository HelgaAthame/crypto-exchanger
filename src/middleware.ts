import { NextRequest, NextResponse } from "next/server";

const PROTECTED = ["/history", "/alerts", "/recurring"];
const AUTH_COOKIE = "ce_auth";

/**
 * Turns "signed out" into a real 307 before anything renders.
 *
 * The layout guard alone is not enough: by the time a layout throws
 * `redirect()`, Next has begun streaming, so it can only send the redirect
 * inside the payload with a 200 status. Browsers follow that fine, but the
 * response still carries the protected page's metadata and reads as OK to
 * anything that is not a browser.
 *
 * This is an optimistic check — it only asks whether a session cookie exists,
 * because verifying it means a database round trip on every request. The
 * cookie is not trusted: `requireUser` in each layout still validates the
 * session against the database, so a forged or expired token gets no further.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /**
   * Currency pages are prerendered under upper-case codes, and
   * `dynamicParams: false` means anything else is a 404 — so `/rates/btc`
   * would fail on Linux while quietly working on a case-insensitive local
   * filesystem. Redirecting instead of accepting both also keeps one canonical
   * URL per currency.
   */
  const currency = /^\/rates\/([^/]+)$/.exec(pathname);
  if (currency) {
    const code = decodeURIComponent(currency[1]);
    if (code !== code.toUpperCase()) {
      const canonical = request.nextUrl.clone();
      canonical.pathname = `/rates/${encodeURIComponent(code.toUpperCase())}`;
      return NextResponse.redirect(canonical, 308);
    }
    return NextResponse.next();
  }

  if (!PROTECTED.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return NextResponse.next();
  }

  if (request.cookies.has(AUTH_COOKIE)) return NextResponse.next();

  const login = new URL("/login", request.url);
  login.searchParams.set("next", pathname);
  return NextResponse.redirect(login, 307);
}

export const config = {
  matcher: ["/history/:path*", "/alerts/:path*", "/recurring/:path*", "/rates/:code"],
};
