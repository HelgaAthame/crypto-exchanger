import { NextRequest, NextResponse } from "next/server";
import { isSupportedCurrency } from "@/lib/currencies";
import { buildCrossSeries, seriesChangePercent } from "@/lib/rate-history";
import { getUsdSeries } from "@/lib/rates/cache";

const ALLOWED_DAYS = [7, 30, 90];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from")?.toUpperCase();
  const to = searchParams.get("to")?.toUpperCase();
  const days = Number(searchParams.get("days") ?? 30);

  if (!from || !to) {
    return NextResponse.json(
      { error: "Query params 'from' and 'to' are required" },
      { status: 400 }
    );
  }
  if (!isSupportedCurrency(from) || !isSupportedCurrency(to)) {
    return NextResponse.json({ error: "Unsupported currency" }, { status: 400 });
  }
  if (!ALLOWED_DAYS.includes(days)) {
    return NextResponse.json(
      { error: `'days' must be one of ${ALLOWED_DAYS.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const [giveUsd, receiveUsd] = await Promise.all([
      getUsdSeries(from, days),
      getUsdSeries(to, days),
    ]);

    const points = buildCrossSeries(from, to, giveUsd, receiveUsd);
    return NextResponse.json({
      from,
      to,
      days,
      points,
      changePercent: seriesChangePercent(points),
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch rate history" }, { status: 502 });
  }
}
