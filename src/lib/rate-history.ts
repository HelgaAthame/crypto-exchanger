export type RatePoint = { date: string; rate: number };

/**
 * Builds the A→B rate series from two "USD per unit" series.
 *
 * USD itself has no series of its own — it is the bridge, so it is treated as a
 * constant 1. Only days present in both inputs are emitted, since a day missing
 * on one side has no defensible rate (fiat has no weekend quotes).
 */
export function buildCrossSeries(
  give: string,
  receive: string,
  giveUsd: Record<string, number>,
  receiveUsd: Record<string, number>
): RatePoint[] {
  if (give === receive) return [];

  const days =
    give === "USD"
      ? Object.keys(receiveUsd)
      : receive === "USD"
        ? Object.keys(giveUsd)
        : Object.keys(giveUsd).filter((day) => day in receiveUsd);

  const points: RatePoint[] = [];
  for (const date of days) {
    const a = give === "USD" ? 1 : giveUsd[date];
    const b = receive === "USD" ? 1 : receiveUsd[date];
    if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0) continue;
    points.push({ date, rate: a / b });
  }

  return points.sort((x, y) => x.date.localeCompare(y.date));
}

/** Percentage change across the series, used for the headline delta. */
export function seriesChangePercent(points: RatePoint[]): number | null {
  if (points.length < 2) return null;
  const first = points[0].rate;
  const last = points[points.length - 1].rate;
  if (!Number.isFinite(first) || first <= 0) return null;
  return ((last - first) / first) * 100;
}
