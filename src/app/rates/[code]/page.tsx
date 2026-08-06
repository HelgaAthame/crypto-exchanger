import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ALL_CURRENCIES, getCurrency } from "@/lib/currencies";
import { CurrencyDetail } from "./currency-detail";

type Props = { params: Promise<{ code: string }> };

/**
 * The supported list is fixed and short, so every real page is prerendered.
 *
 * `dynamicParams = false` is what makes an unknown code a real 404: Next
 * answers 404 for anything outside this list without rendering at all. Relying
 * on `notFound()` alone was not enough — the page still got prerendered and
 * cached, and the cached entry answered 200.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return ALL_CURRENCIES.map((currency) => ({ code: currency.code }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const currency = getCurrency(code.toUpperCase());
  if (!currency) return { title: "Currency not found" };

  return {
    title: `${currency.name} (${currency.code})`,
    description: `Live ${currency.code} price in US dollars, 24-hour change, rate history and cross-rates against every other currency this demo supports.`,
  };
}

/**
 * A server component purely so an unknown code answers with a real 404.
 *
 * The page used to call `notFound()` from the client, which renders the 404
 * screen but still reports HTTP 200 — fine for a person, wrong for anything
 * reading status codes. Validating here happens before the response begins.
 */
export default async function CurrencyPage({ params }: Props) {
  const { code } = await params;
  const currency = getCurrency(code.toUpperCase());
  if (!currency) notFound();

  return <CurrencyDetail code={currency.code} />;
}
