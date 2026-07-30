export type ExchangeRequestStatus = "pending" | "completed" | "cancelled";

export type PaymentMethod = "card" | "bank" | "crypto" | "demo-balance";

/** Where the user currently is in the checkout flow. Source of truth for
 *  navigation — the URL is only a view onto it. */
export type ExchangeStep =
  | "method"
  | "details"
  | "confirm"
  | "otp"
  | "deposit"
  | "status";

/** Simulated processing stages shown on the status tracker. */
export type ExchangeStage =
  | "awaiting-payment"
  | "payment-received"
  | "exchanging"
  | "sending"
  | "completed";

export type PaymentDetails = {
  /** Card: last four digits only — the full number is never stored. */
  cardLast4?: string;
  cardHolder?: string;
  /** Bank transfer: demo IBAN and account holder. */
  iban?: string;
  accountHolder?: string;
  /** Crypto: the address the user wants to receive funds at. */
  payoutAddress?: string;
};

export type ExchangeRequest = {
  id: string;
  createdAt: string;
  status: ExchangeRequestStatus;
  giveCurrency: string;
  receiveCurrency: string;
  giveAmount: number;
  receiveAmount: number;
  feeAmount: number;
  rateAtCreation: number;
  recipientContact: string;
  step: ExchangeStep;
  paymentMethod?: PaymentMethod;
  paymentDetails?: PaymentDetails;
  stage?: ExchangeStage;
  /** Fake transaction hash, generated when the exchange starts. */
  txHash?: string;
};
