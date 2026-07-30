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

async function fetchCryptoUsdRates(): Promise<{
  rates: UsdRates;
  changes24h: Record<string, number>;
}> {
  const ids = CRYPTO_CURRENCIES.map((c) => COINGECKO_IDS[c.code]).join(",");
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) {
    throw new Error(`CoinGecko request failed: ${res.status}`);
  }
  const data = (await res.json()) as Record<
    string,
    { usd: number; usd_24h_change?: number }
  >;

  const rates: UsdRates = {};
  const changes24h: Record<string, number> = {};
  for (const currency of CRYPTO_CURRENCIES) {
    const id = COINGECKO_IDS[currency.code];
    const entry = data[id];
    if (typeof entry?.usd === "number") {
      rates[currency.code] = entry.usd;
    }
    if (typeof entry?.usd_24h_change === "number") {
      changes24h[currency.code] = entry.usd_24h_change;
    }
  }
  return { rates, changes24h };
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

/** One USD price per calendar day, keyed by `YYYY-MM-DD`. */
export type UsdSeries = Record<string, number>;

function toDayKey(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

async function fetchCryptoUsdSeries(code: string, days: number): Promise<UsdSeries> {
  const id = COINGECKO_IDS[code];
  const url = `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${days}&interval=daily`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) {
    throw new Error(`CoinGecko history request failed: ${res.status}`);
  }
  const data = (await res.json()) as { prices: [number, number][] };

  const series: UsdSeries = {};
  for (const [ms, price] of data.prices ?? []) {
    // Later samples on the same day overwrite earlier ones, leaving the close.
    series[toDayKey(ms)] = price;
  }
  return series;
}

async function fetchFiatUsdSeries(code: string, days: number): Promise<UsdSeries> {
  if (code === "USD") return {};

  const end = new Date();
  const start = new Date(end.getTime() - days * 86_400_000);
  const url = `https://api.frankfurter.dev/v1/${start.toISOString().slice(0, 10)}..${end
    .toISOString()
    .slice(0, 10)}?base=USD&symbols=${code}`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) {
    throw new Error(`Frankfurter history request failed: ${res.status}`);
  }
  const data = (await res.json()) as { rates: Record<string, Record<string, number>> };

  const series: UsdSeries = {};
  for (const [day, rates] of Object.entries(data.rates ?? {})) {
    const perUsd = rates[code];
    // Frankfurter gives "1 USD = X CODE"; the rest of the app works in USD per unit.
    if (typeof perUsd === "number" && perUsd > 0) series[day] = 1 / perUsd;
  }
  return series;
}

export async function fetchUsdSeries(code: string, days: number): Promise<UsdSeries> {
  if (code === "USD") return {};
  return COINGECKO_IDS[code]
    ? fetchCryptoUsdSeries(code, days)
    : fetchFiatUsdSeries(code, days);
}

export async function fetchAllUsdRates(): Promise<{
  rates: UsdRates;
  changes24h: Record<string, number>;
}> {
  const [crypto, fiat] = await Promise.all([fetchCryptoUsdRates(), fetchFiatUsdRates()]);
  return { rates: { ...crypto.rates, ...fiat }, changes24h: crypto.changes24h };
}
