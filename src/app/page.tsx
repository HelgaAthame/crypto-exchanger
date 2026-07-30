import Image from "next/image";
import { Gauge, Receipt, UserRoundCheck, Zap } from "lucide-react";
import { ExchangeCalculator } from "@/components/exchange-calculator";

const HIGHLIGHTS = [
  {
    icon: Receipt,
    title: "Transparent pricing",
    body: "Market rate and our service fee are always shown as separate lines.",
  },
  {
    icon: Gauge,
    title: "Live market data",
    body: "Rates come straight from CoinGecko and Frankfurter, refreshed every minute.",
  },
  {
    icon: UserRoundCheck,
    title: "No account needed",
    body: "Price any pair instantly — requests stay in your own browser.",
  },
];

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 top-10 size-96 rounded-full bg-accent/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 top-1/3 size-[26rem] rounded-full bg-accent/10 blur-3xl"
      />

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-5 pb-20 pt-12 lg:grid-cols-[1fr_minmax(0,26rem)] lg:gap-16 lg:pt-20">
        <section className="rise-in order-2 lg:order-1">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-accent">
            <Zap className="size-3" aria-hidden />
            Live market rates
          </span>

          <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
            Exchange crypto and fiat,
            <br />
            <span className="gold-text">instantly priced</span>
          </h1>

          <p className="mt-4 max-w-md text-base text-muted">
            Pick a pair, enter an amount, and see exactly what you receive. Nine currencies,
            live rates, and a fee you can actually read.
          </p>

          <ul className="mt-8 flex flex-col gap-5">
            {HIGHLIGHTS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-3.5">
                <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl border border-accent/25 bg-accent/10 text-accent">
                  <Icon className="size-4" aria-hidden />
                </span>
                <span>
                  <span className="block text-sm font-medium">{title}</span>
                  <span className="mt-0.5 block text-sm text-muted">{body}</span>
                </span>
              </li>
            ))}
          </ul>

          <div className="relative mt-10 hidden lg:block">
            <div
              aria-hidden
              className="pointer-events-none absolute left-6 top-2 size-40 rounded-full bg-accent/15 blur-3xl"
            />
            <Image
              src="/logo/logo-full.png"
              alt="Crypto Exchanger"
              width={200}
              height={230}
              className="relative opacity-90"
            />
          </div>
        </section>

        <div className="rise-in order-1 lg:order-2">
          <ExchangeCalculator />
        </div>
      </div>
    </div>
  );
}
