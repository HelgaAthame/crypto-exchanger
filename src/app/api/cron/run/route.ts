import { NextRequest, NextResponse } from "next/server";
import { eq, isNull, or } from "drizzle-orm";
import { isAlertTriggered } from "@/lib/alerts";
import { getDb, isDatabaseConfigured } from "@/lib/db/client";
import { limitOrders, rateAlerts, recurringPlans, users } from "@/lib/db/schema";
import { alertEmailHtml, sendEmail } from "@/lib/email/send";
import { computeCrossRate } from "@/lib/exchange-calc";
import { DEFAULT_FEE_PERCENT } from "@/lib/limits";
import { fillAmount, isOrderFillable } from "@/lib/limit-orders";
import { formatLogLine } from "@/lib/monitoring/report";
import { fetchAllUsdRates } from "@/lib/rates/providers";
import { selectDuePlans } from "@/lib/scheduler";
import type { Cadence } from "@/lib/recurring";
import { exchangeRequests } from "@/lib/db/schema";

/**
 * The scheduled half of the app.
 *
 * Alerts, limit orders and recurring plans were all checked in the browser,
 * which meant they only worked while a tab was open — honest, but not what
 * those features mean. This runs them server-side against the same live rates,
 * so a plan executes and an alert fires whether or not anyone is looking.
 *
 * The in-browser watcher stays: it is what makes an alert appear within a
 * minute rather than at the next scheduled run.
 */

/** One run should never fan out unboundedly and time out. */
const MAX_PLANS_PER_RUN = 25;

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

export async function GET(request: NextRequest) {
  // Vercel Cron sends this header; without a secret configured the endpoint
  // stays shut rather than being open to anyone who guesses the path.
  const secret = process.env.CRON_SECRET;
  if (!secret) return unauthorized();
  if (request.headers.get("authorization") !== `Bearer ${secret}`) return unauthorized();

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ skipped: "no-database" });
  }

  const db = getDb();
  const now = new Date();
  const { rates } = await fetchAllUsdRates();
  const usd = new Map(Object.entries(rates));

  const rate = (give: string, receive: string): number | null => {
    const a = usd.get(give);
    const b = usd.get(receive);
    return a && b ? computeCrossRate(a, b) : null;
  };

  const summary = { alerts: 0, emails: 0, orders: 0, plans: 0 };

  // Alerts still waiting.
  const openAlerts = await db.select().from(rateAlerts).where(isNull(rateAlerts.triggeredAt));
  for (const alert of openAlerts) {
    const current = rate(alert.giveCurrency, alert.receiveCurrency);
    if (current === null) continue;

    const shaped = {
      ...alert,
      createdAt: alert.createdAt.toISOString(),
      triggeredAt: null,
      direction: alert.direction as "above" | "below",
    };
    if (!isAlertTriggered(shaped, current)) continue;

    await db
      .update(rateAlerts)
      .set({ triggeredAt: now })
      .where(eq(rateAlerts.id, alert.id));
    summary.alerts += 1;

    // Only an account has an address; anonymous alerts stay in-app only.
    if (!alert.userId) continue;
    const owner = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, alert.userId))
      .limit(1);
    if (!owner[0]) continue;

    const result = await sendEmail({
      to: owner[0].email,
      subject: `${alert.giveCurrency}/${alert.receiveCurrency} hit your target`,
      html: alertEmailHtml({
        pair: `${alert.giveCurrency}/${alert.receiveCurrency}`,
        direction: alert.direction,
        target: String(alert.targetRate),
        current: current.toPrecision(6),
      }),
    });
    if (result.sent) summary.emails += 1;
  }

  // Limit orders still open.
  const openOrders = await db.select().from(limitOrders).where(eq(limitOrders.status, "open"));
  for (const order of openOrders) {
    const current = rate(order.giveCurrency, order.receiveCurrency);
    if (current === null) continue;

    const shaped = {
      ...order,
      createdAt: order.createdAt.toISOString(),
      filledAt: null,
      filledRate: null,
      status: "open" as const,
      direction: order.direction as "above" | "below",
    };
    if (!isOrderFillable(shaped, current)) continue;

    // Fills at the live rate, not the target — the market can gap past it.
    await db
      .update(limitOrders)
      .set({ status: "filled", filledAt: now, filledRate: current })
      .where(eq(limitOrders.id, order.id));
    summary.orders += 1;
  }

  // Recurring plans that have come due.
  const plans = await db
    .select()
    .from(recurringPlans)
    .where(or(eq(recurringPlans.paused, false), isNull(recurringPlans.lastRunAt)));

  const due = selectDuePlans(
    plans.map((plan) => ({
      ...plan,
      cadence: plan.cadence as Cadence,
      startsAt: plan.startsAt.toISOString(),
      lastRunAt: plan.lastRunAt?.toISOString() ?? null,
    })),
    now,
    MAX_PLANS_PER_RUN
  );

  for (const plan of due) {
    const current = rate(plan.giveCurrency, plan.receiveCurrency);
    if (current === null) continue;

    const { receiveAmount, feeAmount } = fillAmount(
      plan.amount,
      current,
      DEFAULT_FEE_PERCENT
    );

    // A run records the trade it would have made: a completed demo request,
    // indistinguishable in the history from one made by hand.
    await db.insert(exchangeRequests).values({
      id: crypto.randomUUID(),
      sessionId: plan.sessionId,
      userId: plan.userId,
      createdAt: now,
      updatedAt: now,
      status: "completed",
      step: "status",
      stage: "completed",
      mode: "buy",
      giveCurrency: plan.giveCurrency,
      receiveCurrency: plan.receiveCurrency,
      giveAmount: plan.amount,
      receiveAmount,
      feeAmount,
      rateAtCreation: current,
      recipientContact: "recurring plan",
    });

    await db
      .update(recurringPlans)
      .set({ lastRunAt: now })
      .where(eq(recurringPlans.id, plan.id));
    summary.plans += 1;
  }

  console.log(
    formatLogLine(
      { message: `cron run: ${JSON.stringify(summary)}`, source: "server" },
      now
    )
  );
  return NextResponse.json({ ranAt: now.toISOString(), ...summary });
}
