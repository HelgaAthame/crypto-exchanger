import { CRYPTO_CURRENCIES, FIAT_CURRENCIES } from "@/lib/currencies";

const COINGECKO_IDS: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  USDT: "tether",
  USDC: "usd-coin",
  SOL: "solana",
  BNB: "binancecoin",
};

type UsdRates = Record<string, number>;

async function fetchCryptoUsdRates(): Promise<UsdRates> {
  const ids = CRYPTO_CURRENCIES.map((c) => COINGECKO_IDS[c.code]).join(",");
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) {
    throw new Error(`CoinGecko request failed: ${res.status}`);
  }
  const data = (await res.json()) as Record<string, { usd: number }>;

  const result: UsdRates = {};
  for (const currency of CRYPTO_CURRENCIES) {
    const id = COINGECKO_IDS[currency.code];
    const usd = data[id]?.usd;
    if (typeof usd === "number") {
      result[currency.code] = usd;
    }
  }
  return result;
}

async function fetchFiatUsdRates(): Promise<UsdRates> {
  const symbols = FIAT_CURRENCIES.map((c) => c.code)
    .filter((code) => code !== "USD")
    .join(",");
  const url = `https://api.frankfurter.dev/v1/latest?base=USD&symbols=${symbols}`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) {
    throw new Error(`Frankfurter request failed: ${res.status}`);
  }
  const data = (await res.json()) as { rates: Record<string, number> };

  const result: UsdRates = { USD: 1 };
  for (const [code, rateFromUsd] of Object.entries(data.rates)) {
    // Frankfurter gives "1 USD = X CODE", we want "1 CODE = ? USD"
    result[code] = 1 / rateFromUsd;
  }
  return result;
}

export async function fetchAllUsdRates(): Promise<UsdRates> {
  const [crypto, fiat] = await Promise.all([fetchCryptoUsdRates(), fetchFiatUsdRates()]);
  return { ...crypto, ...fiat };
}
