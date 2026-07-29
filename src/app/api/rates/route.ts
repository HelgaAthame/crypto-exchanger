import { NextRequest, NextResponse } from "next/server";
import { isSupportedCurrency } from "@/lib/currencies";
import { computeCrossRate } from "@/lib/exchange-calc";
import { getUsdRates } from "@/lib/rates/cache";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from")?.toUpperCase();
  const to = searchParams.get("to")?.toUpperCase();

  if (!from || !to) {
    return NextResponse.json(
      { error: "Query params 'from' and 'to' are required" },
      { status: 400 }
    );
  }
  if (!isSupportedCurrency(from) || !isSupportedCurrency(to)) {
    return NextResponse.json({ error: "Unsupported currency" }, { status: 400 });
  }

  try {
    const { rates, fetchedAt } = await getUsdRates();
    const rateFromUsd = rates[from];
    const rateToUsd = rates[to];

    if (!rateFromUsd || !rateToUsd) {
      return NextResponse.json({ error: "Rate unavailable" }, { status: 502 });
    }

    const rate = computeCrossRate(rateFromUsd, rateToUsd);
    return NextResponse.json({
      from,
      to,
      rate,
      updatedAt: new Date(fetchedAt).toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch rates" }, { status: 502 });
  }
}
