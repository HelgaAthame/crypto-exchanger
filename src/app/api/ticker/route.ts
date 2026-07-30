import { NextResponse } from "next/server";
import { ALL_CURRENCIES } from "@/lib/currencies";
import { getUsdRates } from "@/lib/rates/cache";

export async function GET() {
  try {
    const { rates, changes24h, fetchedAt } = await getUsdRates();

    const items = ALL_CURRENCIES.filter((currency) => rates[currency.code]).map(
      (currency) => ({
        code: currency.code,
        name: currency.name,
        kind: currency.kind,
        usdPrice: rates[currency.code],
        change24h: changes24h[currency.code] ?? null,
      })
    );

    return NextResponse.json({
      items,
      updatedAt: new Date(fetchedAt).toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch rates" }, { status: 502 });
  }
}
