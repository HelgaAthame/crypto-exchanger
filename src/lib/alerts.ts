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

export function validateAlert(input: ValidateAlertInput): {
  valid: boolean;
  errors: string[];
} {
  const { targetRate, currentRate, giveCurrency, receiveCurrency, isCurrencySupported } =
    input;
  const errors: string[] = [];

  if (!Number.isFinite(targetRate) || targetRate <= 0) {
    errors.push("Target rate must be a positive number");
  } else if (targetRate === currentRate) {
    errors.push("Target rate matches the current rate — pick a different one");
  }

  if (!isCurrencySupported(giveCurrency)) {
    errors.push(`Currency ${giveCurrency} is not supported`);
  }
  if (!isCurrencySupported(receiveCurrency)) {
    errors.push(`Currency ${receiveCurrency} is not supported`);
  }
  if (giveCurrency === receiveCurrency) {
    errors.push("An alert needs two different currencies");
  }

  return { valid: errors.length === 0, errors };
}
