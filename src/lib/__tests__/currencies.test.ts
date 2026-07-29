import { describe, expect, it } from "vitest";
import { getCurrency, isSupportedCurrency } from "../currencies";

describe("currencies", () => {
  it("finds a known currency", () => {
    expect(getCurrency("BTC")?.name).toBe("Bitcoin");
  });

  it("returns undefined for unknown currency", () => {
    expect(getCurrency("XYZ")).toBeUndefined();
  });

  it("reports supported currencies correctly", () => {
    expect(isSupportedCurrency("USD")).toBe(true);
    expect(isSupportedCurrency("XYZ")).toBe(false);
  });
});
