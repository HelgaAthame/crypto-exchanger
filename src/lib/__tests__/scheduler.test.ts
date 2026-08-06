import { describe, expect, it } from "vitest";
import { isPlanDue, selectDuePlans, type SchedulablePlan } from "../scheduler";

const at = (iso: string) => new Date(iso);

function plan(overrides: Partial<SchedulablePlan> = {}): SchedulablePlan {
  return {
    cadence: "weekly",
    startsAt: "2026-03-01T00:00:00.000Z",
    paused: false,
    amount: 100,
    lastRunAt: null,
    ...overrides,
  };
}

describe("isPlanDue", () => {
  it("is due once it has started and has never run", () => {
    expect(isPlanDue(plan(), at("2026-03-01T00:00:00.000Z"))).toBe(true);
    expect(isPlanDue(plan(), at("2026-03-05T00:00:00.000Z"))).toBe(true);
  });

  it("is not due before its start date", () => {
    expect(isPlanDue(plan(), at("2026-02-28T23:59:00.000Z"))).toBe(false);
  });

  it("is never due while paused", () => {
    expect(isPlanDue(plan({ paused: true }), at("2026-06-01T00:00:00.000Z"))).toBe(false);
  });

  it("waits a full cadence after the last run", () => {
    const ran = plan({ lastRunAt: "2026-03-08T00:00:00.000Z" });
    expect(isPlanDue(ran, at("2026-03-14T00:00:00.000Z"))).toBe(false);
    expect(isPlanDue(ran, at("2026-03-15T00:00:00.000Z"))).toBe(true);
  });

  it("still fires when the scheduler runs late", () => {
    // Down for a fortnight: the plan is overdue, not skipped.
    const ran = plan({ lastRunAt: "2026-03-08T00:00:00.000Z" });
    expect(isPlanDue(ran, at("2026-03-29T00:00:00.000Z"))).toBe(true);
  });

  it("does not run twice when the scheduler fires twice in one window", () => {
    const ran = plan({ cadence: "daily", lastRunAt: "2026-03-08T09:00:00.000Z" });
    expect(isPlanDue(ran, at("2026-03-08T09:05:00.000Z"))).toBe(false);
  });

  it("advances monthly plans by calendar month", () => {
    const ran = plan({
      cadence: "monthly",
      startsAt: "2026-01-31T00:00:00.000Z",
      lastRunAt: "2026-01-31T00:00:00.000Z",
    });
    expect(isPlanDue(ran, at("2026-02-27T00:00:00.000Z"))).toBe(false);
    expect(isPlanDue(ran, at("2026-02-28T00:00:00.000Z"))).toBe(true);
  });

  it("treats unusable dates as not due, or as never run", () => {
    expect(isPlanDue(plan({ startsAt: "nonsense" }), at("2026-06-01"))).toBe(false);
    // A corrupt lastRunAt should not freeze the plan forever.
    expect(isPlanDue(plan({ lastRunAt: "nonsense" }), at("2026-06-01"))).toBe(true);
  });
});

describe("selectDuePlans", () => {
  const now = at("2026-06-01T00:00:00.000Z");

  it("returns only the due ones", () => {
    const plans = [
      plan({ amount: 1 }),
      plan({ amount: 2, paused: true }),
      plan({ amount: 3, startsAt: "2027-01-01T00:00:00.000Z" }),
    ];
    expect(selectDuePlans(plans, now, 10).map((p) => p.amount)).toEqual([1]);
  });

  it("caps the batch so a long outage cannot time the run out", () => {
    const plans = Array.from({ length: 50 }, (_, i) => plan({ amount: i }));
    expect(selectDuePlans(plans, now, 20)).toHaveLength(20);
  });

  it("treats a non-positive limit as nothing to do", () => {
    expect(selectDuePlans([plan()], now, 0)).toEqual([]);
    expect(selectDuePlans([plan()], now, -5)).toEqual([]);
  });
});
