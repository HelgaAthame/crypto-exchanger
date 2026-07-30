import { describe, expect, it } from "vitest";
import { nextStep, resolveStepAccess, stepIndex, stepsForMethod } from "../checkout-flow";

describe("stepIndex", () => {
  it("orders steps from method through status", () => {
    expect(stepIndex("method")).toBeLessThan(stepIndex("details"));
    expect(stepIndex("details")).toBeLessThan(stepIndex("confirm"));
    expect(stepIndex("confirm")).toBeLessThan(stepIndex("status"));
  });

  it("returns -1 for an unknown step", () => {
    // @ts-expect-error deliberately invalid step
    expect(stepIndex("nope")).toBe(-1);
  });
});

describe("stepsForMethod", () => {
  it("skips details and authorisation for the demo balance", () => {
    expect(stepsForMethod("demo-balance")).toEqual(["method", "confirm", "status"]);
  });

  it("adds an OTP step for card payments", () => {
    expect(stepsForMethod("card")).toContain("otp");
    expect(stepsForMethod("card")).not.toContain("deposit");
  });

  it("adds a deposit step for crypto payments", () => {
    expect(stepsForMethod("crypto")).toContain("deposit");
    expect(stepsForMethod("crypto")).not.toContain("otp");
  });

  it("uses details but no authorisation step for bank transfers", () => {
    expect(stepsForMethod("bank")).toEqual(["method", "details", "confirm", "status"]);
  });

  it("allows only the method step when no method is chosen", () => {
    expect(stepsForMethod(undefined)).toEqual(["method"]);
  });
});

describe("nextStep", () => {
  it("walks the card flow through OTP", () => {
    expect(nextStep("method", "card")).toBe("details");
    expect(nextStep("details", "card")).toBe("confirm");
    expect(nextStep("confirm", "card")).toBe("otp");
    expect(nextStep("otp", "card")).toBe("status");
  });

  it("walks the crypto flow through the deposit screen", () => {
    expect(nextStep("confirm", "crypto")).toBe("deposit");
    expect(nextStep("deposit", "crypto")).toBe("status");
  });

  it("goes straight from method to confirm on the demo balance", () => {
    expect(nextStep("method", "demo-balance")).toBe("confirm");
  });

  it("ends at status from the last step", () => {
    expect(nextStep("status", "bank")).toBe("status");
  });

  it("falls back to status for a step outside the method's flow", () => {
    expect(nextStep("otp", "bank")).toBe("status");
  });
});

describe("resolveStepAccess", () => {
  it("allows the current step", () => {
    expect(resolveStepAccess("details", "details", "card")).toEqual({ allowed: true });
  });

  it("allows going back to an earlier step", () => {
    expect(resolveStepAccess("method", "confirm", "card")).toEqual({ allowed: true });
  });

  it("blocks jumping ahead and redirects to the stored step", () => {
    expect(resolveStepAccess("confirm", "details", "card")).toEqual({
      allowed: false,
      redirectTo: "details",
    });
  });

  it("blocks a step the method never uses", () => {
    expect(resolveStepAccess("otp", "status", "bank")).toEqual({
      allowed: false,
      redirectTo: "status",
    });
  });

  it("blocks everything past the method step when no method is chosen", () => {
    expect(resolveStepAccess("details", "method", undefined)).toEqual({
      allowed: false,
      redirectTo: "method",
    });
  });
});
