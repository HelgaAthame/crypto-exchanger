import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, isDatabaseConfigured } from "@/lib/db/client";
import { limitOrders } from "@/lib/db/schema";
import { ownerFilter, resolveOwner } from "@/lib/db/owner";
import type { LimitOrder } from "@/lib/limit-orders";

const NOT_CONFIGURED = NextResponse.json(
  { error: "Persistence is not configured" },
  { status: 501 }
);

const orderSchema = z.object({
  id: z.string().min(1),
  createdAt: z.string(),
  giveCurrency: z.string().min(1),
  receiveCurrency: z.string().min(1),
  giveAmount: z.number().finite().positive(),
  targetRate: z.number().finite().positive(),
  direction: z.enum(["above", "below"]),
  rateAtCreation: z.number().finite(),
  status: z.enum(["open", "filled", "cancelled"]),
  filledAt: z.string().nullable(),
  filledRate: z.number().finite().nullable(),
});

export async function GET() {
  if (!isDatabaseConfigured()) return NOT_CONFIGURED;

  const owner = await resolveOwner();
  const rows = await getDb()
    .select()
    .from(limitOrders)
    .where(ownerFilter(owner, limitOrders))
    .orderBy(desc(limitOrders.createdAt));

  return NextResponse.json({
    orders: rows.map(
      (row): LimitOrder => ({
        id: row.id,
        createdAt: row.createdAt.toISOString(),
        giveCurrency: row.giveCurrency,
        receiveCurrency: row.receiveCurrency,
        giveAmount: row.giveAmount,
        targetRate: row.targetRate,
        direction: row.direction as LimitOrder["direction"],
        rateAtCreation: row.rateAtCreation,
        status: row.status as LimitOrder["status"],
        filledAt: row.filledAt?.toISOString() ?? null,
        filledRate: row.filledRate,
      })
    ),
  });
}

export async function PUT(request: NextRequest) {
  if (!isDatabaseConfigured()) return NOT_CONFIGURED;

  const parsed = orderSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid order payload" }, { status: 400 });
  }

  const owner = await resolveOwner();
  const input = parsed.data;
  const values = {
    id: input.id,
    sessionId: owner.sessionId,
    userId: owner.userId,
    createdAt: new Date(input.createdAt),
    giveCurrency: input.giveCurrency,
    receiveCurrency: input.receiveCurrency,
    giveAmount: input.giveAmount,
    targetRate: input.targetRate,
    direction: input.direction,
    rateAtCreation: input.rateAtCreation,
    status: input.status,
    filledAt: input.filledAt ? new Date(input.filledAt) : null,
    filledRate: input.filledRate,
  };

  await getDb()
    .insert(limitOrders)
    .values(values)
    .onConflictDoUpdate({ target: limitOrders.id, set: values });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  if (!isDatabaseConfigured()) return NOT_CONFIGURED;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const owner = await resolveOwner();
  await getDb()
    .delete(limitOrders)
    .where(and(eq(limitOrders.id, id), ownerFilter(owner, limitOrders)));

  return NextResponse.json({ ok: true });
}
