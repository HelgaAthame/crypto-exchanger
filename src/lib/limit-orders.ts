import type { AlertDirection } from "@/lib/alerts";

export type LimitOrderStatus = "open" | "filled" | "cancelled";

export type LimitOrder = {
  id: string;
  createdAt: string;
  giveCurrency: string;
  receiveCurrency: string;
  /** Amount of `giveCurrency` the order would spend when it fills. */
  giveAmount: number;
  /** Fire when the rate reaches this, in `receiveCurrency` per unit given. */
  targetRate: number;
  direction: AlertDirection;
  rateAtCreation: number;
  status: LimitOrderStatus;
  filledAt: string | null;
  /** The rate the order actually filled at, which is rarely the target. */
  filledRate: number | null;
};

/**
 * A buy limit waits for the price to fall, a sell limit for it to rise — so
 * the direction follows from where the target sits, exactly as it does for
 * alerts. Asking the user to state it as well only invites contradictions.
 */
export function directionForTarget(
  targetRate: number,
  currentRate: number
): AlertDirection {
  return targetRate >= currentRate ? "above" : "below";
}

export function isOrderFillable(order: LimitOrder, currentRate: number): boolean {
  if (order.status !== "open") return false;
  if (!Number.isFinite(currentRate) || currentRate <= 0) return false;

  return order.direction === "above"
    ? currentRate >= order.targetRate
    : currentRate <= order.targetRate;
}

/**
 * What the order yields at the rate it filled at, minus the fee.
 *
 * A real exchange fills at the market rate once the trigger is crossed, not at
 * the target — the market can gap straight past it. Modelling that is the
 * whole point of a limit order, so the fill rate is carried separately and the
 * receive amount is computed from it.
 */
export function fillAmount(
  giveAmount: number,
  fillRate: number,
  feePercent: number
): { receiveAmount: number; feeAmount: number } {
  if (
    !Number.isFinite(giveAmount) ||
    giveAmount <= 0 ||
    !Number.isFinite(fillRate) ||
    fillRate <= 0
  ) {
    return { receiveAmount: 0, feeAmount: 0 };
  }

  const gross = giveAmount * fillRate;
  const feeAmount = gross * (feePercent / 100);
  return { receiveAmount: gross - feeAmount, feeAmount };
}

/** How far the rate still has to move, as a percentage of where it is now. */
export function distanceToTargetPercent(
  order: Pick<LimitOrder, "targetRate">,
  currentRate: number
): number | null {
  if (!Number.isFinite(currentRate) || currentRate <= 0) return null;
  return ((order.targetRate - currentRate) / currentRate) * 100;
}

export type LimitOrderIssue = {
  code:
    | "amount.notPositive"
    | "target.notPositive"
    | "target.sameAsCurrent"
    | "currency.same"
    | "currency.unsupported";
  message: string;
  params?: Record<string, string | number>;
};

export function validateLimitOrder(input: {
  giveAmount: number;
  targetRate: number;
  currentRate: number;
  giveCurrency: string;
  receiveCurrency: string;
  isCurrencySupported: (code: string) => boolean;
}): { valid: boolean; issues: LimitOrderIssue[] } {
  const issues: LimitOrderIssue[] = [];

  if (!Number.isFinite(input.giveAmount) || input.giveAmount <= 0) {
    issues.push({ code: "amount.notPositive", message: "Amount must be a positive number" });
  }
  if (!Number.isFinite(input.targetRate) || input.targetRate <= 0) {
    issues.push({
      code: "target.notPositive",
      message: "Target rate must be a positive number",
    });
  } else if (input.targetRate === input.currentRate) {
    // Would fill on the next tick, which is a market order wearing a costume.
    issues.push({
      code: "target.sameAsCurrent",
      message: "Target rate matches the current rate — pick a different one",
    });
  }
  if (!input.isCurrencySupported(input.giveCurrency)) {
    issues.push({
      code: "currency.unsupported",
      message: `Currency ${input.giveCurrency} is not supported`,
      params: { code: input.giveCurrency },
    });
  }
  if (!input.isCurrencySupported(input.receiveCurrency)) {
    issues.push({
      code: "currency.unsupported",
      message: `Currency ${input.receiveCurrency} is not supported`,
      params: { code: input.receiveCurrency },
    });
  }
  if (input.giveCurrency === input.receiveCurrency) {
    issues.push({ code: "currency.same", message: "Pick two different currencies" });
  }

  return { valid: issues.length === 0, issues };
}
