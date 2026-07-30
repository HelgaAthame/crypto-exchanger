import { fetchAllUsdRates } from "@/lib/rates/providers";

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
