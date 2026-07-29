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

export type ValidateExchangeRequestResult = {
  valid: boolean;
  errors: string[];
};

export function validateExchangeRequest(
  input: ValidateExchangeRequestInput
): ValidateExchangeRequestResult {
  const errors: string[] = [];
  const { amount, giveCurrency, receiveCurrency, minAmount, maxAmount, isCurrencySupported } =
    input;

  if (!Number.isFinite(amount) || amount <= 0) {
    errors.push("Amount must be a positive number");
  } else {
    if (amount < minAmount) {
      errors.push(`Amount must be at least ${minAmount}`);
    }
    if (amount > maxAmount) {
      errors.push(`Amount must not exceed ${maxAmount}`);
    }
  }

  if (!isCurrencySupported(giveCurrency)) {
    errors.push(`Currency ${giveCurrency} is not supported`);
  }
  if (!isCurrencySupported(receiveCurrency)) {
    errors.push(`Currency ${receiveCurrency} is not supported`);
  }
  if (giveCurrency === receiveCurrency) {
    errors.push("Give and receive currencies must be different");
  }

  return { valid: errors.length === 0, errors };
}
