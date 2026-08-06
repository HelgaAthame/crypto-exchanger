import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session";
import { getDb, isDatabaseConfigured } from "@/lib/db/client";
import { passkeys } from "@/lib/db/schema";

/** The keys on this account, oldest first, without the public key material. */
export async function GET() {
  if (!isDatabaseConfigured()) return NextResponse.json({ passkeys: [] });

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "auth.required" }, { status: 401 });

  const rows = await getDb()
    .select({
      id: passkeys.id,
      label: passkeys.label,
      createdAt: passkeys.createdAt,
      lastUsedAt: passkeys.lastUsedAt,
    })
    .from(passkeys)
    .where(eq(passkeys.userId, user.id))
    .orderBy(asc(passkeys.createdAt));

  return NextResponse.json({ passkeys: rows });
}

/**
 * Removes one key. Scoped to the signed-in user, so knowing another account's
 * credential id gets you nowhere.
 */
export async function DELETE(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "auth.unavailable" }, { status: 501 });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "auth.required" }, { status: 401 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "auth.passkeyUnknown" }, { status: 400 });

  await getDb()
    .delete(passkeys)
    .where(and(eq(passkeys.id, id), eq(passkeys.userId, user.id)));

  return new NextResponse(null, { status: 204 });
}
