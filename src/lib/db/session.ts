import { cookies } from "next/headers";

export const SESSION_COOKIE = "ce_session";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * Reads the anonymous session id, creating one if the visitor has none.
 *
 * This is not authentication and does not pretend to be: it identifies a
 * browser so its own rows can be found again, nothing more. It carries no
 * personal data, so there is nothing to leak if it is copied — but it is
 * httpOnly and sameSite=lax anyway, so a script on the page cannot read it and
 * another site cannot send it.
 */
export async function getSessionId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(SESSION_COOKIE)?.value;
  if (existing) return existing;

  const id = crypto.randomUUID();
  store.set(SESSION_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
  });
  return id;
}
