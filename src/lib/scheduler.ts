import { nextRunAt, type RecurringPlan } from "@/lib/recurring";

export type SchedulablePlan = Pick<
  RecurringPlan,
  "cadence" | "startsAt" | "paused" | "amount"
> & {
  /** When the scheduler last executed this plan; null until it first runs. */
  lastRunAt?: string | null;
};

/**
 * Whether a plan should execute now.
 *
 * A plan is due once its next scheduled moment has passed. `lastRunAt` is the
 * guard against running twice: the scheduler is not guaranteed to fire exactly
 * on time — it can be late, or run twice in a window — so "has the schedule
 * moved on since the last run" is the question, not "is it exactly now".
 */
export function isPlanDue(plan: SchedulablePlan, now: Date): boolean {
  if (plan.paused) return false;

  const start = new Date(plan.startsAt);
  if (Number.isNaN(start.getTime())) return false;
  // Not started yet.
  if (start.getTime() > now.getTime()) return false;

  if (!plan.lastRunAt) return true;

  const last = new Date(plan.lastRunAt);
  if (Number.isNaN(last.getTime())) return true;

  // The first scheduled moment strictly after the last run.
  const next = nextRunAt(plan, new Date(last.getTime() + 1));
  return next !== null && next.getTime() <= now.getTime();
}

/**
 * Picks the plans to execute, capped.
 *
 * A single run should never fan out unboundedly: a scheduler that has been
 * down for a week would otherwise try to settle every missed plan at once and
 * time out, leaving nothing recorded at all.
 */
export function selectDuePlans<T extends SchedulablePlan>(
  plans: T[],
  now: Date,
  limit: number
): T[] {
  return plans.filter((plan) => isPlanDue(plan, now)).slice(0, Math.max(0, limit));
}
