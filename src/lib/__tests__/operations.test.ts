import { describe, expect, it } from "vitest";
import {
  OPERATION_MODES,
  defaultPairForMode,
  invertMode,
  isPairValidForMode,
  kindsForMode,
  payoutLabelForMode,
} from "../operations";
import { getCurrency } from "../currencies";

describe("kindsForMode", () => {
  it("maps each mode to the kinds it accepts", () => {
    expect(kindsForMode("buy")).toEqual({ give: "fiat", receive: "crypto" });
    expect(kindsForMode("sell")).toEqual({ give: "crypto", receive: "fiat" });
    expect(kindsForMode("swap")).toEqual({ give: "crypto", receive: "crypto" });
    expect(kindsForMode("exchange")).toEqual({ give: "fiat", receive: "fiat" });
  });
});

describe("isPairValidForMode", () => {
  it("accepts a pair matching the mode", () => {
    expect(isPairValidForMode("buy", "fiat", "crypto")).toBe(true);
    expect(isPairValidForMode("swap", "crypto", "crypto")).toBe(true);
  });

  it("rejects a pair with the sides the wrong way round", () => {
    expect(isPairValidForMode("buy", "crypto", "fiat")).toBe(false);
  });

  it("rejects unknown currency kinds", () => {
    expect(isPairValidForMode("buy", undefined, "crypto")).toBe(false);
    expect(isPairValidForMode("buy", "fiat", undefined)).toBe(false);
  });
});

describe("defaultPairForMode", () => {
  it("returns a pair that is valid for its own mode", () => {
    for (const { id } of OPERATION_MODES) {
      const { give, receive } = defaultPairForMode(id);
      expect(
        isPairValidForMode(id, getCurrency(give)?.kind, getCurrency(receive)?.kind)
      ).toBe(true);
    }
  });

  it("never pairs a currency with itself", () => {
    for (const { id } of OPERATION_MODES) {
      const { give, receive } = defaultPairForMode(id);
      expect(give).not.toBe(receive);
    }
  });
});

describe("invertMode", () => {
  it("flips buy and sell", () => {
    expect(invertMode("buy")).toBe("sell");
    expect(invertMode("sell")).toBe("buy");
  });

  it("leaves symmetric modes alone", () => {
    expect(invertMode("swap")).toBe("swap");
    expect(invertMode("exchange")).toBe("exchange");
  });
});

describe("payoutLabelForMode", () => {
  it("asks for a wallet when the payout is crypto", () => {
    expect(payoutLabelForMode("buy")).toBe("wallet address");
    expect(payoutLabelForMode("swap")).toBe("wallet address");
  });

  it("asks for a bank account when the payout is fiat", () => {
    expect(payoutLabelForMode("sell")).toBe("bank account");
    expect(payoutLabelForMode("exchange")).toBe("bank account");
  });
});
