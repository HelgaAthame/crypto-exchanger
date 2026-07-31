export type AlertDirection = "above" | "below";

export type RateAlert = {
  id: string;
  createdAt: string;
  giveCurrency: string;
  receiveCurrency: string;
  direction: AlertDirection;
  targetRate: number;
  rateAtCreation: number;
  /** `null` while still waiting. */
  triggeredAt: string | null;
};

/**
 * The direction is derived from where the target sits relative to the current
 * rate, rather than asked for: an alert for "above 100" when the rate is
 * already 200 would fire instantly and mean nothing.
 */
export function suggestDirection(
  targetRate: number,
  currentRate: number
): AlertDirection {
  return targetRate >= currentRate ? "above" : "below";
}

export function isAlertTriggered(alert: RateAlert, currentRate: number): boolean {
  // Already fired once — it stays in the list as a result, not as a watcher.
  if (alert.triggeredAt !== null) return false;
  if (!Number.isFinite(currentRate) || currentRate <= 0) return false;

  return alert.direction === "above"
    ? currentRate >= alert.targetRate
    : currentRate <= alert.targetRate;
}

/** How far the current rate still is from the target, in percent. */
export function distanceToTargetPercent(
  alert: RateAlert,
  currentRate: number
): number | null {
  if (!Number.isFinite(currentRate) || currentRate <= 0) return null;
  return ((alert.targetRate - currentRate) / currentRate) * 100;
}

export type ValidateAlertInput = {
  targetRate: number;
  currentRate: number;
  giveCurrency: string;
  receiveCurrency: string;
  isCurrencySupported: (code: string) => boolean;
};

export type AlertIssue = {
  code: "target.notPositive" | "target.sameAsCurrent" | "currency.unsupported" | "currency.same";
  message: string;
  params?: Record<string, string | number>;
};

export function validateAlert(input: ValidateAlertInput): {
  valid: boolean;
  errors: string[];
  issues: AlertIssue[];
} {
  const { targetRate, currentRate, giveCurrency, receiveCurrency, isCurrencySupported } =
    input;
  const issues: AlertIssue[] = [];

  if (!Number.isFinite(targetRate) || targetRate <= 0) {
    issues.push({
      code: "target.notPositive",
      message: "Target rate must be a positive number",
    });
  } else if (targetRate === currentRate) {
    issues.push({
      code: "target.sameAsCurrent",
      message: "Target rate matches the current rate — pick a different one",
    });
  }

  if (!isCurrencySupported(giveCurrency)) {
    issues.push({
      code: "currency.unsupported",
      message: `Currency ${giveCurrency} is not supported`,
      params: { code: giveCurrency },
    });
  }
  if (!isCurrencySupported(receiveCurrency)) {
    issues.push({
      code: "currency.unsupported",
      message: `Currency ${receiveCurrency} is not supported`,
      params: { code: receiveCurrency },
    });
  }
  if (giveCurrency === receiveCurrency) {
    issues.push({
      code: "currency.same",
      message: "An alert needs two different currencies",
    });
  }

  return {
    valid: issues.length === 0,
    errors: issues.map((issue) => issue.message),
    issues,
  };
}
