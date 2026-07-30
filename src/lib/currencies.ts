export type CurrencyKind = "fiat" | "crypto";

export type Currency = {
  code: string;
  name: string;
  kind: CurrencyKind;
};

// Fiat codes must be ones Frankfurter still publishes — it dropped RUB, so a
// rouble pair would return "rate unavailable" at runtime.
export const FIAT_CURRENCIES: Currency[] = [
  { code: "USD", name: "US Dollar", kind: "fiat" },
  { code: "EUR", name: "Euro", kind: "fiat" },
  { code: "GBP", name: "British Pound", kind: "fiat" },
  { code: "JPY", name: "Japanese Yen", kind: "fiat" },
];

export const CRYPTO_CURRENCIES: Currency[] = [
  { code: "BTC", name: "Bitcoin", kind: "crypto" },
  { code: "ETH", name: "Ethereum", kind: "crypto" },
  { code: "USDT", name: "Tether", kind: "crypto" },
  { code: "USDC", name: "USD Coin", kind: "crypto" },
  { code: "SOL", name: "Solana", kind: "crypto" },
  { code: "BNB", name: "BNB", kind: "crypto" },
];

export const ALL_CURRENCIES: Currency[] = [...FIAT_CURRENCIES, ...CRYPTO_CURRENCIES];

export function getCurrency(code: string): Currency | undefined {
  return ALL_CURRENCIES.find((c) => c.code === code);
}

export function isSupportedCurrency(code: string): boolean {
  return getCurrency(code) !== undefined;
}
