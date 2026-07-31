export type ExchangeDirectionInput = "give" | "receive";

export type ComputeExchangeAmountInput = {
  amount: number;
  direction: ExchangeDirectionInput;
  rate: number;
  feePercent: number;
};

export type ComputeExchangeAmountResult = {
  giveAmount: number;
  receiveAmount: number;
  feeAmount: number;
  effectiveRate: number;
};

export function computeExchangeAmount(
  input: ComputeExchangeAmountInput
): ComputeExchangeAmountResult {
  const { amount, direction, rate, feePercent } = input;

  if (!Number.isFinite(amount) || amount <= 0) {
    return { giveAmount: 0, receiveAmount: 0, feeAmount: 0, effectiveRate: 0 };
  }
  if (!Number.isFinite(rate) || rate <= 0) {
    return { giveAmount: 0, receiveAmount: 0, feeAmount: 0, effectiveRate: 0 };
  }

  const feeFactor = 1 - feePercent / 100;
  const effectiveRate = rate * feeFactor;

  if (direction === "give") {
    const giveAmount = amount;
    const grossReceiveAmount = giveAmount * rate;
    const receiveAmount = grossReceiveAmount * feeFactor;
    const feeAmount = grossReceiveAmount - receiveAmount;
    return { giveAmount, receiveAmount, feeAmount, effectiveRate };
  }

  const receiveAmount = amount;
  const grossGiveAmount = receiveAmount / effectiveRate;
  const giveAmount = grossGiveAmount;
  const feeAmount = giveAmount * rate - receiveAmount;
  return { giveAmount, receiveAmount, feeAmount, effectiveRate };
}

export function computeCrossRate(rateAtoUSD: number, rateBtoUSD: number): number {
  if (
    !Number.isFinite(rateAtoUSD) ||
    !Number.isFinite(rateBtoUSD) ||
    rateAtoUSD <= 0 ||
    rateBtoUSD <= 0
  ) {
    return 0;
  }
  return rateAtoUSD / rateBtoUSD;
}

export type ValidateExchangeRequestInput = {
  amount: number;
  giveCurrency: string;
  receiveCurrency: string;
  minAmount: number;
  maxAmount: number;
  isCurrencySupported: (code: string) => boolean;
};

/**
 * A machine-readable reason plus the values a message needs. The English
 * sentence stays for tests and non-UI callers, but the interface renders from
 * the code so validation can speak the user's language.
 */
export type ValidationIssue = {
  code:
    | "amount.notPositive"
    | "amount.tooSmall"
    | "amount.tooLarge"
    | "currency.unsupported"
    | "currency.same";
  message: string;
  params?: Record<string, string | number>;
};

export type ValidateExchangeRequestResult = {
  valid: boolean;
  errors: string[];
  issues: ValidationIssue[];
};

export function validateExchangeRequest(
  input: ValidateExchangeRequestInput
): ValidateExchangeRequestResult {
  const issues: ValidationIssue[] = [];
  const { amount, giveCurrency, receiveCurrency, minAmount, maxAmount, isCurrencySupported } =
    input;

  if (!Number.isFinite(amount) || amount <= 0) {
    issues.push({ code: "amount.notPositive", message: "Amount must be a positive number" });
  } else {
    if (amount < minAmount) {
      issues.push({
        code: "amount.tooSmall",
        message: `Amount must be at least ${minAmount}`,
        params: { min: minAmount },
      });
    }
    if (amount > maxAmount) {
      issues.push({
        code: "amount.tooLarge",
        message: `Amount must not exceed ${maxAmount}`,
        params: { max: maxAmount },
      });
    }
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
      message: "Give and receive currencies must be different",
    });
  }

  return {
    valid: issues.length === 0,
    errors: issues.map((issue) => issue.message),
    issues,
  };
}
