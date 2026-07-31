import { describe, expect, it } from "vitest";
import {
  daysUntilNextRun,
  nextRunAt,
  projectedSpend,
  validateRecurringPlan,
} from "../recurring";

const at = (iso: string) => new Date(iso);

describe("nextRunAt", () => {
  it("returns the start date when the plan has not started yet", () => {
    const next = nextRunAt(
      { cadence: "weekly", startsAt: "2026-03-10T00:00:00.000Z" },
      at("2026-03-01T00:00:00.000Z")
    );
    expect(next?.toISOString()).toBe("2026-03-10T00:00:00.000Z");
  });

  it("returns the start date when it is exactly now", () => {
    const next = nextRunAt(
      { cadence: "daily", startsAt: "2026-03-10T00:00:00.000Z" },
      at("2026-03-10T00:00:00.000Z")
    );
    expect(next?.toISOString()).toBe("2026-03-10T00:00:00.000Z");
  });

  it("skips past elapsed daily runs in one step", () => {
    const next = nextRunAt(
      { cadence: "daily", startsAt: "2026-03-01T00:00:00.000Z" },
      at("2026-03-05T06:00:00.000Z")
    );
    expect(next?.toISOString()).toBe("2026-03-06T00:00:00.000Z");
  });

  it("lands on the next weekly slot", () => {
    const next = nextRunAt(
      { cadence: "weekly", startsAt: "2026-03-01T00:00:00.000Z" },
      at("2026-03-10T00:00:00.000Z")
    );
    expect(next?.toISOString()).toBe("2026-03-15T00:00:00.000Z");
  });

  it("advances monthly by calendar month, not 30 days", () => {
    const next = nextRunAt(
      { cadence: "monthly", startsAt: "2026-01-15T00:00:00.000Z" },
      at("2026-02-20T00:00:00.000Z")
    );
    expect(next?.toISOString()).toBe("2026-03-15T00:00:00.000Z");
  });

  it("clamps a 31st start to the last day of a shorter month", () => {
    const next = nextRunAt(
      { cadence: "monthly", startsAt: "2026-01-31T00:00:00.000Z" },
      at("2026-02-01T00:00:00.000Z")
    );
    expect(next?.toISOString()).toBe("2026-02-28T00:00:00.000Z");
  });

  it("returns null for an unparseable start date", () => {
    expect(nextRunAt({ cadence: "daily", startsAt: "not a date" }, at("2026-01-01"))).toBeNull();
  });
});

describe("daysUntilNextRun", () => {
  it("counts whole days ahead", () => {
    expect(
      daysUntilNextRun(
        { cadence: "weekly", startsAt: "2026-03-10T00:00:00.000Z" },
        at("2026-03-07T00:00:00.000Z")
      )
    ).toBe(3);
  });

  it("is zero when the run is now", () => {
    expect(
      daysUntilNextRun(
        { cadence: "daily", startsAt: "2026-03-10T00:00:00.000Z" },
        at("2026-03-10T00:00:00.000Z")
      )
    ).toBe(0);
  });

  it("returns null for an unparseable start date", () => {
    expect(daysUntilNextRun({ cadence: "daily", startsAt: "nope" }, at("2026-01-01"))).toBeNull();
  });
});

describe("projectedSpend", () => {
  const plan = { cadence: "weekly" as const, startsAt: "2026-03-01T00:00:00.000Z", amount: 50 };

  it("multiplies the amount by the runs inside the window", () => {
    // Runs on 1, 8, 15, 22, 29 March within 30 days.
    expect(projectedSpend(plan, at("2026-03-01T00:00:00.000Z"), 30)).toBe(250);
  });

  it("counts monthly plans by calendar month", () => {
    expect(
      projectedSpend(
        { cadence: "monthly", startsAt: "2026-01-15T00:00:00.000Z", amount: 100 },
        at("2026-01-01T00:00:00.000Z"),
        90
      )
    ).toBe(300);
  });

  it("is zero for a non-positive amount or window", () => {
    expect(projectedSpend({ ...plan, amount: 0 }, at("2026-03-01"), 30)).toBe(0);
    expect(projectedSpend({ ...plan, amount: Number.NaN }, at("2026-03-01"), 30)).toBe(0);
    expect(projectedSpend(plan, at("2026-03-01"), 0)).toBe(0);
  });

  it("is zero when the window ends before the first run", () => {
    expect(
      projectedSpend(
        { cadence: "monthly", startsAt: "2026-06-01T00:00:00.000Z", amount: 100 },
        at("2026-03-01T00:00:00.000Z"),
        10
      )
    ).toBe(0);
  });
});

describe("validateRecurringPlan", () => {
  const supported = (code: string) => ["USD", "BTC"].includes(code);
  const base = {
    amount: 100,
    giveCurrency: "USD",
    receiveCurrency: "BTC",
    startsAt: "2026-03-01T00:00:00.000Z",
    isCurrencySupported: supported,
  };

  it("accepts a sound plan", () => {
    expect(validateRecurringPlan(base)).toEqual({ valid: true, issues: [] });
  });

  it("rejects a non-positive amount", () => {
    const result = validateRecurringPlan({ ...base, amount: 0 });
    expect(result.valid).toBe(false);
    expect(result.issues[0].code).toBe("amount.notPositive");
  });

  it("rejects unsupported currencies and reports which one", () => {
    const result = validateRecurringPlan({ ...base, giveCurrency: "XYZ" });
    expect(result.issues[0]).toEqual({
      code: "currency.unsupported",
      message: "Currency XYZ is not supported",
      params: { code: "XYZ" },
    });
  });

  it("names the receive currency when that is the unsupported one", () => {
    const result = validateRecurringPlan({ ...base, receiveCurrency: "XYZ" });
    expect(result.issues[0]).toEqual({
      code: "currency.unsupported",
      message: "Currency XYZ is not supported",
      params: { code: "XYZ" },
    });
  });

  it("rejects a pair of the same currency", () => {
    const result = validateRecurringPlan({ ...base, receiveCurrency: "USD" });
    expect(result.issues.map((i) => i.code)).toContain("currency.same");
  });

  it("rejects an unparseable start date", () => {
    const result = validateRecurringPlan({ ...base, startsAt: "nope" });
    expect(result.issues.map((i) => i.code)).toContain("start.invalid");
  });
});
