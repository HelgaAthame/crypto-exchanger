import { describe, expect, it } from "vitest";
import {
  directionForTarget,
  distanceToTargetPercent,
  fillAmount,
  isOrderFillable,
  validateLimitOrder,
  type LimitOrder,
} from "../limit-orders";

function makeOrder(overrides: Partial<LimitOrder> = {}): LimitOrder {
  return {
    id: "o1",
    createdAt: "2026-01-01T00:00:00.000Z",
    giveCurrency: "USD",
    receiveCurrency: "BTC",
    giveAmount: 1000,
    targetRate: 0.00002,
    direction: "above",
    rateAtCreation: 0.000015,
    status: "open",
    filledAt: null,
    filledRate: null,
    ...overrides,
  };
}

describe("directionForTarget", () => {
  it("waits for a rise when the target is above", () => {
    expect(directionForTarget(120, 100)).toBe("above");
  });

  it("waits for a fall when the target is below", () => {
    expect(directionForTarget(80, 100)).toBe("below");
  });

  it("treats an equal target as waiting for a rise", () => {
    expect(directionForTarget(100, 100)).toBe("above");
  });
});

describe("isOrderFillable", () => {
  it("fills once an upward target is reached", () => {
    expect(isOrderFillable(makeOrder(), 0.00002)).toBe(true);
    expect(isOrderFillable(makeOrder(), 0.000021)).toBe(true);
  });

  it("waits below an upward target", () => {
    expect(isOrderFillable(makeOrder(), 0.000019)).toBe(false);
  });

  it("fills once a downward target is reached", () => {
    const order = makeOrder({ direction: "below", targetRate: 0.00001 });
    expect(isOrderFillable(order, 0.00001)).toBe(true);
    expect(isOrderFillable(order, 0.000009)).toBe(true);
    expect(isOrderFillable(order, 0.000011)).toBe(false);
  });

  it("never fills an order that is already done", () => {
    expect(isOrderFillable(makeOrder({ status: "filled" }), 1)).toBe(false);
    expect(isOrderFillable(makeOrder({ status: "cancelled" }), 1)).toBe(false);
  });

  it("ignores an unusable rate", () => {
    expect(isOrderFillable(makeOrder(), 0)).toBe(false);
    expect(isOrderFillable(makeOrder(), Number.NaN)).toBe(false);
  });
});

describe("fillAmount", () => {
  it("charges the fee against the gross proceeds", () => {
    // A real fill happens at the market rate, which may have gapped past the
    // target — so the fill rate is what the maths uses, not the target.
    expect(fillAmount(1000, 0.00002, 1.5)).toEqual({
      receiveAmount: 1000 * 0.00002 * 0.985,
      feeAmount: 1000 * 0.00002 * 0.015,
    });
  });

  it("returns zero for unusable inputs", () => {
    for (const [amount, rate] of [
      [0, 1],
      [-5, 1],
      [100, 0],
      [100, -1],
      [Number.NaN, 1],
      [100, Number.NaN],
    ]) {
      expect(fillAmount(amount, rate, 1.5)).toEqual({ receiveAmount: 0, feeAmount: 0 });
    }
  });

  it("takes nothing when the fee is zero", () => {
    expect(fillAmount(100, 2, 0)).toEqual({ receiveAmount: 200, feeAmount: 0 });
  });
});

describe("distanceToTargetPercent", () => {
  it("is positive while the target is above", () => {
    expect(distanceToTargetPercent({ targetRate: 120 }, 100)).toBeCloseTo(20);
  });

  it("is negative once the rate is past the target", () => {
    expect(distanceToTargetPercent({ targetRate: 80 }, 100)).toBeCloseTo(-20);
  });

  it("returns null for an unusable rate", () => {
    expect(distanceToTargetPercent({ targetRate: 100 }, 0)).toBeNull();
    expect(distanceToTargetPercent({ targetRate: 100 }, Number.NaN)).toBeNull();
  });
});

describe("validateLimitOrder", () => {
  const supported = (code: string) => ["USD", "BTC"].includes(code);
  const base = {
    giveAmount: 500,
    targetRate: 0.00002,
    currentRate: 0.000015,
    giveCurrency: "USD",
    receiveCurrency: "BTC",
    isCurrencySupported: supported,
  };

  it("accepts a sound order", () => {
    expect(validateLimitOrder(base)).toEqual({ valid: true, issues: [] });
  });

  it("rejects a non-positive amount", () => {
    expect(validateLimitOrder({ ...base, giveAmount: 0 }).issues[0].code).toBe(
      "amount.notPositive"
    );
  });

  it("rejects a non-positive target", () => {
    expect(validateLimitOrder({ ...base, targetRate: -1 }).issues[0].code).toBe(
      "target.notPositive"
    );
  });

  it("rejects a target equal to the current rate", () => {
    // Otherwise it fills on the next tick and is a market order in disguise.
    const result = validateLimitOrder({ ...base, targetRate: base.currentRate });
    expect(result.issues.map((i) => i.code)).toContain("target.sameAsCurrent");
  });

  it("names whichever currency is unsupported", () => {
    expect(validateLimitOrder({ ...base, giveCurrency: "XYZ" }).issues[0]).toEqual({
      code: "currency.unsupported",
      message: "Currency XYZ is not supported",
      params: { code: "XYZ" },
    });
    expect(validateLimitOrder({ ...base, receiveCurrency: "XYZ" }).issues[0].params).toEqual({
      code: "XYZ",
    });
  });

  it("rejects a pair of the same currency", () => {
    const result = validateLimitOrder({ ...base, receiveCurrency: "USD" });
    expect(result.issues.map((i) => i.code)).toContain("currency.same");
  });
});
