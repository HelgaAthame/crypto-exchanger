import { redirect } from "next/navigation";
import { getCurrentUser, type AuthUser } from "@/lib/auth/session";
import { isDatabaseConfigured } from "@/lib/db/client";

/**
 * Gate for the pages that list what belongs to one person.
 *
 * With no database there are no accounts to sign into, and the data lives in
 * localStorage anyway — gating then would lock people out of their own
 * records behind a login that cannot work. So the guard only applies once
 * persistence is configured.
 */
export async function requireUser(next: string): Promise<AuthUser | null> {
  if (!isDatabaseConfigured()) return null;

  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}
