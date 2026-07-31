import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, isDatabaseConfigured } from "@/lib/db/client";
import { rateAlerts } from "@/lib/db/schema";
import { getSessionId } from "@/lib/db/session";
import type { RateAlert } from "@/lib/alerts";

const NOT_CONFIGURED = NextResponse.json(
  { error: "Persistence is not configured" },
  { status: 501 }
);

const alertSchema = z.object({
  id: z.string().min(1),
  createdAt: z.string(),
  giveCurrency: z.string().min(1),
  receiveCurrency: z.string().min(1),
  direction: z.enum(["above", "below"]),
  targetRate: z.number().finite().positive(),
  rateAtCreation: z.number().finite(),
  triggeredAt: z.string().nullable(),
});

export async function GET() {
  if (!isDatabaseConfigured()) return NOT_CONFIGURED;

  const sessionId = await getSessionId();
  const rows = await getDb()
    .select()
    .from(rateAlerts)
    .where(eq(rateAlerts.sessionId, sessionId))
    .orderBy(desc(rateAlerts.createdAt));

  return NextResponse.json({
    alerts: rows.map(
      (row): RateAlert => ({
        id: row.id,
        createdAt: row.createdAt.toISOString(),
        giveCurrency: row.giveCurrency,
        receiveCurrency: row.receiveCurrency,
        direction: row.direction as RateAlert["direction"],
        targetRate: row.targetRate,
        rateAtCreation: row.rateAtCreation,
        triggeredAt: row.triggeredAt?.toISOString() ?? null,
      })
    ),
  });
}

export async function PUT(request: NextRequest) {
  if (!isDatabaseConfigured()) return NOT_CONFIGURED;

  const parsed = alertSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid alert payload" }, { status: 400 });
  }

  const sessionId = await getSessionId();
  const input = parsed.data;
  const values = {
    id: input.id,
    sessionId,
    createdAt: new Date(input.createdAt),
    giveCurrency: input.giveCurrency,
    receiveCurrency: input.receiveCurrency,
    direction: input.direction,
    targetRate: input.targetRate,
    rateAtCreation: input.rateAtCreation,
    triggeredAt: input.triggeredAt ? new Date(input.triggeredAt) : null,
  };

  await getDb()
    .insert(rateAlerts)
    .values(values)
    .onConflictDoUpdate({ target: rateAlerts.id, set: values });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  if (!isDatabaseConfigured()) return NOT_CONFIGURED;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const sessionId = await getSessionId();
  // Scoped by session as well as id, so one browser cannot delete another's row.
  await getDb()
    .delete(rateAlerts)
    .where(and(eq(rateAlerts.id, id), eq(rateAlerts.sessionId, sessionId)));

  return NextResponse.json({ ok: true });
}
