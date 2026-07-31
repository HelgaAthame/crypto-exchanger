import { describe, expect, it } from "vitest";
import {
  distanceToTargetPercent,
  isAlertTriggered,
  suggestDirection,
  validateAlert,
  type RateAlert,
} from "../alerts";

function makeAlert(overrides: Partial<RateAlert> = {}): RateAlert {
  return {
    id: "a1",
    createdAt: "2026-01-01T00:00:00.000Z",
    giveCurrency: "BTC",
    receiveCurrency: "USD",
    direction: "above",
    targetRate: 70000,
    rateAtCreation: 60000,
    triggeredAt: null,
    ...overrides,
  };
}

describe("suggestDirection", () => {
  it("watches upwards when the target is above the current rate", () => {
    expect(suggestDirection(70000, 60000)).toBe("above");
  });

  it("watches downwards when the target is below the current rate", () => {
    expect(suggestDirection(50000, 60000)).toBe("below");
  });

  it("treats an equal target as upwards", () => {
    expect(suggestDirection(60000, 60000)).toBe("above");
  });
});

describe("isAlertTriggered", () => {
  it("fires when an upward target is reached exactly", () => {
    expect(isAlertTriggered(makeAlert(), 70000)).toBe(true);
  });

  it("fires when an upward target is passed", () => {
    expect(isAlertTriggered(makeAlert(), 71000)).toBe(true);
  });

  it("stays quiet below an upward target", () => {
    expect(isAlertTriggered(makeAlert(), 69999)).toBe(false);
  });

  it("fires when a downward target is reached", () => {
    const alert = makeAlert({ direction: "below", targetRate: 50000 });
    expect(isAlertTriggered(alert, 50000)).toBe(true);
    expect(isAlertTriggered(alert, 49000)).toBe(true);
    expect(isAlertTriggered(alert, 51000)).toBe(false);
  });

  it("never fires twice", () => {
    const alert = makeAlert({ triggeredAt: "2026-01-02T00:00:00.000Z" });
    expect(isAlertTriggered(alert, 999999)).toBe(false);
  });

  it("ignores an unusable current rate", () => {
    expect(isAlertTriggered(makeAlert(), 0)).toBe(false);
    expect(isAlertTriggered(makeAlert(), Number.NaN)).toBe(false);
  });
});

describe("distanceToTargetPercent", () => {
  it("is positive while the target is still above", () => {
    expect(distanceToTargetPercent(makeAlert(), 50000)).toBeCloseTo(40);
  });

  it("is negative once the rate is past the target", () => {
    expect(distanceToTargetPercent(makeAlert(), 100000)).toBeCloseTo(-30);
  });

  it("returns null for an unusable rate", () => {
    expect(distanceToTargetPercent(makeAlert(), 0)).toBeNull();
    expect(distanceToTargetPercent(makeAlert(), Number.NaN)).toBeNull();
  });
});

describe("validateAlert", () => {
  const supported = (code: string) => ["BTC", "USD", "EUR"].includes(code);

  it("accepts a sound alert", () => {
    expect(
      validateAlert({
        targetRate: 70000,
        currentRate: 60000,
        giveCurrency: "BTC",
        receiveCurrency: "USD",
        isCurrencySupported: supported,
      })
    ).toEqual({ valid: true, errors: [] });
  });

  it("rejects a non-positive or non-finite target", () => {
    for (const targetRate of [0, -5, Number.NaN]) {
      const result = validateAlert({
        targetRate,
        currentRate: 60000,
        giveCurrency: "BTC",
        receiveCurrency: "USD",
        isCurrencySupported: supported,
      });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/positive number/);
    }
  });

  it("rejects a target equal to the current rate", () => {
    const result = validateAlert({
      targetRate: 60000,
      currentRate: 60000,
      giveCurrency: "BTC",
      receiveCurrency: "USD",
      isCurrencySupported: supported,
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/matches the current rate/);
  });

  it("rejects unsupported currencies", () => {
    const result = validateAlert({
      targetRate: 10,
      currentRate: 5,
      giveCurrency: "XYZ",
      receiveCurrency: "ABC",
      isCurrencySupported: supported,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(2);
  });

  it("rejects a pair of the same currency", () => {
    const result = validateAlert({
      targetRate: 10,
      currentRate: 5,
      giveCurrency: "BTC",
      receiveCurrency: "BTC",
      isCurrencySupported: supported,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("An alert needs two different currencies");
  });
});
