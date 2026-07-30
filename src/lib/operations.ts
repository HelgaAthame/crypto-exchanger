import type { CurrencyKind } from "@/lib/currencies";

export type OperationMode = "buy" | "sell" | "swap" | "exchange";

export const OPERATION_MODES: {
  id: OperationMode;
  label: string;
  description: string;
}[] = [
  { id: "buy", label: "Buy", description: "Pay with fiat, receive crypto" },
  { id: "sell", label: "Sell", description: "Send crypto, receive fiat" },
  { id: "swap", label: "Swap", description: "Exchange one crypto for another" },
  { id: "exchange", label: "Exchange", description: "Convert between currencies" },
];

/** Which kind of currency each side of the pair accepts in a given mode. */
export function kindsForMode(mode: OperationMode): {
  give: CurrencyKind;
  receive: CurrencyKind;
} {
  switch (mode) {
    case "buy":
      return { give: "fiat", receive: "crypto" };
    case "sell":
      return { give: "crypto", receive: "fiat" };
    case "swap":
      return { give: "crypto", receive: "crypto" };
    case "exchange":
      return { give: "fiat", receive: "fiat" };
  }
}

export function isPairValidForMode(
  mode: OperationMode,
  giveKind: CurrencyKind | undefined,
  receiveKind: CurrencyKind | undefined
): boolean {
  if (!giveKind || !receiveKind) return false;
  const expected = kindsForMode(mode);
  return giveKind === expected.give && receiveKind === expected.receive;
}

/** The pair a mode starts on when the user switches into it. */
export function defaultPairForMode(mode: OperationMode): {
  give: string;
  receive: string;
} {
  switch (mode) {
    case "buy":
      return { give: "USD", receive: "BTC" };
    case "sell":
      return { give: "BTC", receive: "USD" };
    case "swap":
      return { give: "BTC", receive: "ETH" };
    case "exchange":
      return { give: "USD", receive: "EUR" };
  }
}

/** Swapping sides turns Buy into Sell and back; Swap/Exchange stay put. */
export function invertMode(mode: OperationMode): OperationMode {
  if (mode === "buy") return "sell";
  if (mode === "sell") return "buy";
  return mode;
}

/** What the recipient field should ask for, per mode. */
export function payoutLabelForMode(mode: OperationMode): string {
  const { receive } = kindsForMode(mode);
  return receive === "crypto" ? "wallet address" : "bank account";
}
