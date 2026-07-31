import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, isDatabaseConfigured } from "@/lib/db/client";
import { recurringPlans } from "@/lib/db/schema";
import { getSessionId } from "@/lib/db/session";
import type { RecurringPlan } from "@/lib/recurring";

const NOT_CONFIGURED = NextResponse.json(
  { error: "Persistence is not configured" },
  { status: 501 }
);

const planSchema = z.object({
  id: z.string().min(1),
  createdAt: z.string(),
  giveCurrency: z.string().min(1),
  receiveCurrency: z.string().min(1),
  amount: z.number().finite().positive(),
  cadence: z.enum(["daily", "weekly", "monthly"]),
  startsAt: z.string(),
  paused: z.boolean(),
});

export async function GET() {
  if (!isDatabaseConfigured()) return NOT_CONFIGURED;

  const sessionId = await getSessionId();
  const rows = await getDb()
    .select()
    .from(recurringPlans)
    .where(eq(recurringPlans.sessionId, sessionId))
    .orderBy(desc(recurringPlans.createdAt));

  return NextResponse.json({
    plans: rows.map(
      (row): RecurringPlan => ({
        id: row.id,
        createdAt: row.createdAt.toISOString(),
        giveCurrency: row.giveCurrency,
        receiveCurrency: row.receiveCurrency,
        amount: row.amount,
        cadence: row.cadence as RecurringPlan["cadence"],
        startsAt: row.startsAt.toISOString(),
        paused: row.paused,
      })
    ),
  });
}

export async function PUT(request: NextRequest) {
  if (!isDatabaseConfigured()) return NOT_CONFIGURED;

  const parsed = planSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid plan payload" }, { status: 400 });
  }

  const sessionId = await getSessionId();
  const input = parsed.data;
  const values = {
    id: input.id,
    sessionId,
    createdAt: new Date(input.createdAt),
    giveCurrency: input.giveCurrency,
    receiveCurrency: input.receiveCurrency,
    amount: input.amount,
    cadence: input.cadence,
    startsAt: new Date(input.startsAt),
    paused: input.paused,
  };

  await getDb()
    .insert(recurringPlans)
    .values(values)
    .onConflictDoUpdate({ target: recurringPlans.id, set: values });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  if (!isDatabaseConfigured()) return NOT_CONFIGURED;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const sessionId = await getSessionId();
  await getDb()
    .delete(recurringPlans)
    .where(and(eq(recurringPlans.id, id), eq(recurringPlans.sessionId, sessionId)));

  return NextResponse.json({ ok: true });
}
