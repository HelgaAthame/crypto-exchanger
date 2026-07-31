import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, isDatabaseConfigured } from "@/lib/db/client";
import { exchangeRequests } from "@/lib/db/schema";
import { getSessionId } from "@/lib/db/session";
import type { ExchangeRequest } from "@/types/exchange-request";

/** 501 rather than 500: the app is expected to run without a database. */
const NOT_CONFIGURED = NextResponse.json(
  { error: "Persistence is not configured" },
  { status: 501 }
);

const requestSchema = z.object({
  id: z.string().min(1),
  createdAt: z.string(),
  status: z.enum(["pending", "completed", "cancelled"]),
  step: z.enum(["method", "details", "confirm", "otp", "deposit", "status"]),
  stage: z.string().nullable().optional(),
  mode: z.string().nullable().optional(),
  giveCurrency: z.string().min(1),
  receiveCurrency: z.string().min(1),
  giveAmount: z.number().finite(),
  receiveAmount: z.number().finite(),
  feeAmount: z.number().finite(),
  rateAtCreation: z.number().finite(),
  recipientContact: z.string(),
  paymentMethod: z.string().nullable().optional(),
  paymentDetails: z.record(z.string(), z.unknown()).nullable().optional(),
  txHash: z.string().nullable().optional(),
});

export async function GET() {
  if (!isDatabaseConfigured()) return NOT_CONFIGURED;

  const sessionId = await getSessionId();
  const rows = await getDb()
    .select()
    .from(exchangeRequests)
    .where(eq(exchangeRequests.sessionId, sessionId))
    .orderBy(desc(exchangeRequests.createdAt));

  return NextResponse.json({ requests: rows.map(toClient) });
}

export async function PUT(request: NextRequest) {
  if (!isDatabaseConfigured()) return NOT_CONFIGURED;

  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }

  const sessionId = await getSessionId();
  const input = parsed.data;
  const values = {
    id: input.id,
    sessionId,
    createdAt: new Date(input.createdAt),
    updatedAt: new Date(),
    status: input.status,
    step: input.step,
    stage: input.stage ?? null,
    mode: input.mode ?? null,
    giveCurrency: input.giveCurrency,
    receiveCurrency: input.receiveCurrency,
    giveAmount: input.giveAmount,
    receiveAmount: input.receiveAmount,
    feeAmount: input.feeAmount,
    rateAtCreation: input.rateAtCreation,
    recipientContact: input.recipientContact,
    paymentMethod: input.paymentMethod ?? null,
    paymentDetails: (input.paymentDetails ?? null) as never,
    txHash: input.txHash ?? null,
  };

  // The client owns the id and pushes the whole record on every change, so an
  // upsert keeps the two in step without a separate create/update protocol.
  await getDb()
    .insert(exchangeRequests)
    .values(values)
    .onConflictDoUpdate({ target: exchangeRequests.id, set: values });

  return NextResponse.json({ ok: true });
}

type Row = typeof exchangeRequests.$inferSelect;

function toClient(row: Row): ExchangeRequest {
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    status: row.status as ExchangeRequest["status"],
    step: row.step as ExchangeRequest["step"],
    stage: (row.stage ?? undefined) as ExchangeRequest["stage"],
    mode: (row.mode ?? undefined) as ExchangeRequest["mode"],
    giveCurrency: row.giveCurrency,
    receiveCurrency: row.receiveCurrency,
    giveAmount: row.giveAmount,
    receiveAmount: row.receiveAmount,
    feeAmount: row.feeAmount,
    rateAtCreation: row.rateAtCreation,
    recipientContact: row.recipientContact,
    paymentMethod: (row.paymentMethod ?? undefined) as ExchangeRequest["paymentMethod"],
    paymentDetails: row.paymentDetails ?? undefined,
    txHash: row.txHash ?? undefined,
  };
}
