export type ExchangeRequestStatus = "pending" | "completed" | "cancelled";

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
};
