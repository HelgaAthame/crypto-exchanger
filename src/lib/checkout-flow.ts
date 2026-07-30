import type { ExchangeStep, PaymentMethod } from "@/types/exchange-request";

/** Steps every flow passes through, in order. `otp` and `deposit` are
 *  method-specific and slot in between confirm and status. */
const STEP_ORDER: ExchangeStep[] = [
  "method",
  "details",
  "confirm",
  "otp",
  "deposit",
  "status",
];

export function stepIndex(step: ExchangeStep): number {
  return STEP_ORDER.indexOf(step);
}

/** Which steps a given payment method actually uses. */
export function stepsForMethod(method: PaymentMethod | undefined): ExchangeStep[] {
  if (method === "demo-balance") {
    // No payment details to collect and nothing to authorise.
    return ["method", "confirm", "status"];
  }
  if (method === "card") {
    return ["method", "details", "confirm", "otp", "status"];
  }
  if (method === "crypto") {
    return ["method", "details", "confirm", "deposit", "status"];
  }
  if (method === "bank") {
    return ["method", "details", "confirm", "status"];
  }
  // Method not chosen yet — only the first step is reachable.
  return ["method"];
}

export function nextStep(
  current: ExchangeStep,
  method: PaymentMethod | undefined
): ExchangeStep {
  const steps = stepsForMethod(method);
  const at = steps.indexOf(current);
  if (at === -1 || at === steps.length - 1) return "status";
  return steps[at + 1];
}

export type StepAccess =
  | { allowed: true }
  | { allowed: false; redirectTo: ExchangeStep };

/**
 * Guards direct URL access. Users may revisit a step they already passed, but
 * never jump ahead of the step stored on the request.
 */
export function resolveStepAccess(
  requested: ExchangeStep,
  current: ExchangeStep,
  method: PaymentMethod | undefined
): StepAccess {
  const steps = stepsForMethod(method);

  // A step this method never uses (e.g. `otp` for a bank transfer).
  if (!steps.includes(requested)) {
    return { allowed: false, redirectTo: current };
  }
  if (stepIndex(requested) > stepIndex(current)) {
    return { allowed: false, redirectTo: current };
  }
  return { allowed: true };
}
