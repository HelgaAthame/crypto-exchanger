import { describe, expect, it } from "vitest";
import {
  computeCrossRate,
  computeExchangeAmount,
  validateExchangeRequest,
} from "../exchange-calc";

describe("computeExchangeAmount", () => {
  it("computes receiveAmount from a given giveAmount, applying fee", () => {
    const result = computeExchangeAmount({
      amount: 100,
      direction: "give",
      rate: 2,
      feePercent: 10,
    });
    expect(result.giveAmount).toBe(100);
    expect(result.receiveAmount).toBeCloseTo(180); // 100*2=200 gross, -10% fee = 180
    expect(result.feeAmount).toBeCloseTo(20);
    expect(result.effectiveRate).toBeCloseTo(1.8);
  });

  it("computes giveAmount from a given receiveAmount, applying fee", () => {
    const result = computeExchangeAmount({
      amount: 180,
      direction: "receive",
      rate: 2,
      feePercent: 10,
    });
    expect(result.receiveAmount).toBe(180);
    expect(result.giveAmount).toBeCloseTo(100);
    expect(result.feeAmount).toBeCloseTo(20);
    expect(result.effectiveRate).toBeCloseTo(1.8);
  });

  it("handles zero fee", () => {
    const result = computeExchangeAmount({
      amount: 50,
      direction: "give",
      rate: 3,
      feePercent: 0,
    });
    expect(result.receiveAmount).toBeCloseTo(150);
    expect(result.feeAmount).toBeCloseTo(0);
    expect(result.effectiveRate).toBeCloseTo(3);
  });

  it("returns zeros for non-positive amount", () => {
    const result = computeExchangeAmount({
      amount: 0,
      direction: "give",
      rate: 2,
      feePercent: 10,
    });
    expect(result).toEqual({
      giveAmount: 0,
      receiveAmount: 0,
      feeAmount: 0,
      effectiveRate: 0,
    });
  });

  it("returns zeros for negative amount", () => {
    const result = computeExchangeAmount({
      amount: -5,
      direction: "give",
      rate: 2,
      feePercent: 10,
    });
    expect(result.receiveAmount).toBe(0);
  });

  it("returns zeros for NaN amount", () => {
    const result = computeExchangeAmount({
      amount: NaN,
      direction: "give",
      rate: 2,
      feePercent: 10,
    });
    expect(result.receiveAmount).toBe(0);
  });

  it("returns zeros for non-positive rate", () => {
    const result = computeExchangeAmount({
      amount: 100,
      direction: "give",
      rate: 0,
      feePercent: 10,
    });
    expect(result.receiveAmount).toBe(0);
  });

  it("returns zeros for negative rate", () => {
    const result = computeExchangeAmount({
      amount: 100,
      direction: "give",
      rate: -1,
      feePercent: 10,
    });
    expect(result.receiveAmount).toBe(0);
  });

  it("round-trips give -> receive -> give consistently", () => {
    const give = computeExchangeAmount({
      amount: 250,
      direction: "give",
      rate: 4.5,
      feePercent: 2.5,
    });
    const back = computeExchangeAmount({
      amount: give.receiveAmount,
      direction: "receive",
      rate: 4.5,
      feePercent: 2.5,
    });
    expect(back.giveAmount).toBeCloseTo(250, 6);
  });
});

describe("computeCrossRate", () => {
  it("computes cross rate via USD bridge", () => {
    // A=BTC worth 50000 USD, B=ETH worth 2500 USD => 1 BTC = 20 ETH
    expect(computeCrossRate(50000, 2500)).toBeCloseTo(20);
  });

  it("returns 0 for non-positive inputs", () => {
    expect(computeCrossRate(0, 100)).toBe(0);
    expect(computeCrossRate(100, 0)).toBe(0);
    expect(computeCrossRate(-1, 100)).toBe(0);
    expect(computeCrossRate(100, -1)).toBe(0);
  });

  it("returns 0 for non-finite inputs", () => {
    expect(computeCrossRate(NaN, 100)).toBe(0);
    expect(computeCrossRate(100, Infinity)).toBe(0);
  });
});

describe("validateExchangeRequest", () => {
  const isCurrencySupported = (code: string) => ["USD", "BTC", "ETH"].includes(code);

  it("passes for a valid request", () => {
    const result = validateExchangeRequest({
      amount: 100,
      giveCurrency: "USD",
      receiveCurrency: "BTC",
      minAmount: 10,
      maxAmount: 10000,
      isCurrencySupported,
    });
    expect(result).toEqual({ valid: true, errors: [] });
  });

  it("fails for non-positive amount", () => {
    const result = validateExchangeRequest({
      amount: 0,
      giveCurrency: "USD",
      receiveCurrency: "BTC",
      minAmount: 10,
      maxAmount: 10000,
      isCurrencySupported,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Amount must be a positive number");
  });

  it("fails when amount is below minimum", () => {
    const result = validateExchangeRequest({
      amount: 5,
      giveCurrency: "USD",
      receiveCurrency: "BTC",
      minAmount: 10,
      maxAmount: 10000,
      isCurrencySupported,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Amount must be at least 10");
  });

  it("fails when amount exceeds maximum", () => {
    const result = validateExchangeRequest({
      amount: 20000,
      giveCurrency: "USD",
      receiveCurrency: "BTC",
      minAmount: 10,
      maxAmount: 10000,
      isCurrencySupported,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Amount must not exceed 10000");
  });

  it("fails for unsupported give currency", () => {
    const result = validateExchangeRequest({
      amount: 100,
      giveCurrency: "XYZ",
      receiveCurrency: "BTC",
      minAmount: 10,
      maxAmount: 10000,
      isCurrencySupported,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Currency XYZ is not supported");
  });

  it("fails for unsupported receive currency", () => {
    const result = validateExchangeRequest({
      amount: 100,
      giveCurrency: "USD",
      receiveCurrency: "XYZ",
      minAmount: 10,
      maxAmount: 10000,
      isCurrencySupported,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Currency XYZ is not supported");
  });

  it("fails when give and receive currencies are the same", () => {
    const result = validateExchangeRequest({
      amount: 100,
      giveCurrency: "USD",
      receiveCurrency: "USD",
      minAmount: 10,
      maxAmount: 10000,
      isCurrencySupported,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Give and receive currencies must be different");
  });

  it("accumulates multiple errors", () => {
    const result = validateExchangeRequest({
      amount: -1,
      giveCurrency: "XYZ",
      receiveCurrency: "XYZ",
      minAmount: 10,
      maxAmount: 10000,
      isCurrencySupported,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(1);
  });
});
