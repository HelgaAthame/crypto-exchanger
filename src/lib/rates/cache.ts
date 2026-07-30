import { fetchAllUsdRates, fetchUsdSeries, type UsdSeries } from "@/lib/rates/providers";

const CACHE_TTL_MS = 60_000;

type CacheEntry = {
  rates: Record<string, number>;
  changes24h: Record<string, number>;
  fetchedAt: number;
};

let cache: CacheEntry | null = null;
let inFlight: Promise<CacheEntry> | null = null;

async function loadFreshRates(): Promise<CacheEntry> {
  const { rates, changes24h } = await fetchAllUsdRates();
  const entry: CacheEntry = { rates, changes24h, fetchedAt: Date.now() };
  cache = entry;
  return entry;
}

/** History moves once a day, so it is cached far longer than spot rates. */
const SERIES_TTL_MS = 15 * 60_000;

type SeriesEntry = { series: UsdSeries; fetchedAt: number };

const seriesCache = new Map<string, SeriesEntry>();
const seriesInFlight = new Map<string, Promise<UsdSeries>>();

export async function getUsdSeries(code: string, days: number): Promise<UsdSeries> {
  const key = `${code}:${days}`;
  const cached = seriesCache.get(key);
  if (cached && Date.now() - cached.fetchedAt < SERIES_TTL_MS) {
    return cached.series;
  }

  const pending = seriesInFlight.get(key);
  if (pending) return pending;

  const request = fetchUsdSeries(code, days)
    .then((series) => {
      seriesCache.set(key, { series, fetchedAt: Date.now() });
      return series;
    })
    .finally(() => {
      seriesInFlight.delete(key);
    });

  seriesInFlight.set(key, request);
  return request;
}

export async function getUsdRates(): Promise<CacheEntry> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache;
  }
  if (inFlight) {
    return inFlight;
  }
  inFlight = loadFreshRates().finally(() => {
    inFlight = null;
  });
  return inFlight;
}
