export type Cadence = "daily" | "weekly" | "monthly";

export type RecurringPlan = {
  id: string;
  createdAt: string;
  giveCurrency: string;
  receiveCurrency: string;
  /** Amount of `giveCurrency` bought on each run. */
  amount: number;
  cadence: Cadence;
  /** ISO date of the first run. */
  startsAt: string;
  paused: boolean;
};

export const CADENCE_DAYS: Record<Cadence, number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
};

/**
 * Advances a month by calendar, not by 30 days, and clamps overflow: a plan
 * started on the 31st runs on the 30th in a 30-day month rather than sliding
 * into the next one, which is what a real recurring purchase does.
 */
function addMonths(date: Date, count: number): Date {
  const day = date.getUTCDate();
  const shifted = new Date(date);
  shifted.setUTCDate(1);
  shifted.setUTCMonth(shifted.getUTCMonth() + count);

  const daysInMonth = new Date(
    Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1, 0)
  ).getUTCDate();
  shifted.setUTCDate(Math.min(day, daysInMonth));
  return shifted;
}

/**
 * The first run at or after `from`. A plan whose start is still in the future
 * simply reports its start date.
 */
export function nextRunAt(
  plan: Pick<RecurringPlan, "cadence" | "startsAt">,
  from: Date
): Date | null {
  const start = new Date(plan.startsAt);
  if (Number.isNaN(start.getTime())) return null;
  if (start.getTime() >= from.getTime()) return start;

  if (plan.cadence === "monthly") {
    let next = start;
    // Month lengths differ, so step rather than divide.
    let guard = 0;
    while (next.getTime() < from.getTime() && guard < 1200) {
      next = addMonths(next, 1);
      guard += 1;
    }
    return next;
  }

  const stepMs = CADENCE_DAYS[plan.cadence] * 86_400_000;
  const elapsed = from.getTime() - start.getTime();
  const steps = Math.ceil(elapsed / stepMs);
  return new Date(start.getTime() + steps * stepMs);
}

/** Whole days until the next run, rounded up; 0 means it is due today. */
export function daysUntilNextRun(
  plan: Pick<RecurringPlan, "cadence" | "startsAt">,
  from: Date
): number | null {
  const next = nextRunAt(plan, from);
  if (!next) return null;
  return Math.max(0, Math.ceil((next.getTime() - from.getTime()) / 86_400_000));
}

/** Total spend a plan commits to over a window, for the "you would invest" line. */
export function projectedSpend(
  plan: Pick<RecurringPlan, "cadence" | "startsAt" | "amount">,
  from: Date,
  days: number
): number {
  if (!Number.isFinite(plan.amount) || plan.amount <= 0 || days <= 0) return 0;

  const end = new Date(from.getTime() + days * 86_400_000);
  let runs = 0;
  let cursor = nextRunAt(plan, from);
  let guard = 0;

  while (cursor && cursor.getTime() <= end.getTime() && guard < 1000) {
    runs += 1;
    cursor =
      plan.cadence === "monthly"
        ? addMonths(cursor, 1)
        : new Date(cursor.getTime() + CADENCE_DAYS[plan.cadence] * 86_400_000);
    guard += 1;
  }

  return runs * plan.amount;
}

export type RecurringIssue = {
  code: "amount.notPositive" | "currency.same" | "currency.unsupported" | "start.invalid";
  message: string;
  params?: Record<string, string | number>;
};

export function validateRecurringPlan(input: {
  amount: number;
  giveCurrency: string;
  receiveCurrency: string;
  startsAt: string;
  isCurrencySupported: (code: string) => boolean;
}): { valid: boolean; issues: RecurringIssue[] } {
  const issues: RecurringIssue[] = [];

  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    issues.push({ code: "amount.notPositive", message: "Amount must be a positive number" });
  }
  if (!input.isCurrencySupported(input.giveCurrency)) {
    issues.push({
      code: "currency.unsupported",
      message: `Currency ${input.giveCurrency} is not supported`,
      params: { code: input.giveCurrency },
    });
  }
  if (!input.isCurrencySupported(input.receiveCurrency)) {
    issues.push({
      code: "currency.unsupported",
      message: `Currency ${input.receiveCurrency} is not supported`,
      params: { code: input.receiveCurrency },
    });
  }
  if (input.giveCurrency === input.receiveCurrency) {
    issues.push({ code: "currency.same", message: "Pick two different currencies" });
  }
  if (Number.isNaN(new Date(input.startsAt).getTime())) {
    issues.push({ code: "start.invalid", message: "Pick a valid start date" });
  }

  return { valid: issues.length === 0, issues };
}
