import { Suspense } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  Calculator,
  Gauge,
  LineChart,
  Receipt,
  ShieldAlert,
  UserRoundCheck,
  Wallet,
  Zap,
} from "lucide-react";
import { ExchangeCalculator } from "@/components/exchange-calculator";
import { HeroBackdrop } from "@/components/home/hero-backdrop";
import { PageContainer } from "@/components/layout/page-container";
import { Reveal } from "@/components/layout/reveal";

const HIGHLIGHTS = [
  {
    icon: Receipt,
    title: "Transparent pricing",
    body: "The market rate and our service fee are always shown as separate lines, never folded into one number.",
  },
  {
    icon: Gauge,
    title: "Live market data",
    body: "Rates come straight from CoinGecko and Frankfurter, refreshed every minute and cached server-side.",
  },
  {
    icon: UserRoundCheck,
    title: "No account needed",
    body: "Price any pair instantly. Requests stay in your own browser — there is nothing to sign up for.",
  },
];

const STEPS = [
  {
    icon: Calculator,
    title: "Price it",
    body: "Choose buy, sell, swap or exchange, then type an amount on either side of the pair.",
  },
  {
    icon: Wallet,
    title: "Check out",
    body: "Pick a payment method and walk the real checkout steps — card, bank, crypto deposit or demo balance.",
  },
  {
    icon: LineChart,
    title: "Track it",
    body: "Follow the request through its pipeline, or set an alert and get told when a rate hits your target.",
  },
];

export default function Home() {
  return (
    <div className="relative">
      <section className="relative overflow-hidden">
        <HeroBackdrop />

        <PageContainer className="relative grid items-center gap-12 pb-16 pt-14 lg:grid-cols-[1fr_minmax(0,28rem)] lg:gap-16 lg:pb-24 lg:pt-20">
          <div className="rise-in order-2 lg:order-1">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-accent">
              <Zap className="size-3" aria-hidden />
              Live market rates
            </span>

            <h1 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              Exchange crypto and fiat,
              <br />
              <span className="gold-text">instantly priced</span>
            </h1>

            <p className="mt-5 max-w-prose text-base text-muted sm:text-lg">
              Pick a pair, enter an amount, and see exactly what you receive. Ten currencies,
              live rates, and a fee you can actually read.
            </p>

            <div className="mt-8 flex flex-wrap gap-2.5">
              <Link
                href="/rates"
                className="sheen-border inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-medium transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 active:translate-y-0"
              >
                Browse live rates
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link
                href="/alerts"
                className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-muted transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
              >
                <BellRing className="size-4" aria-hidden />
                Set a rate alert
              </Link>
            </div>
          </div>

          <div className="rise-in order-1 lg:order-2">
            {/* The calculator reads deep-link params, so it needs a Suspense boundary. */}
            <Suspense fallback={<div className="surface-card h-96 rounded-3xl" />}>
              <ExchangeCalculator />
            </Suspense>
          </div>
        </PageContainer>
      </section>

      <PageContainer className="pb-20">
        <Reveal>
          <section aria-labelledby="how-heading" className="border-t border-border/60 pt-14">
            <h2 id="how-heading" className="text-2xl font-semibold tracking-tight sm:text-3xl">
              How it works
            </h2>
            <p className="mt-2 max-w-prose text-sm text-muted">
              Three steps, none of which move real money.
            </p>

            <ol className="mt-8 grid gap-5 md:grid-cols-3">
              {STEPS.map(({ icon: Icon, title, body }, i) => (
                <li key={title}>
                  <Reveal delay={i * 90}>
                    <div className="surface-card h-full rounded-2xl p-5">
                      <span className="flex items-center gap-2.5">
                        <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-accent/25 bg-accent/10 text-accent">
                          <Icon className="size-4" aria-hidden />
                        </span>
                        <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
                          Step {i + 1}
                        </span>
                      </span>
                      <p className="mt-4 font-medium">{title}</p>
                      <p className="mt-1.5 text-sm text-muted">{body}</p>
                    </div>
                  </Reveal>
                </li>
              ))}
            </ol>
          </section>
        </Reveal>

        <Reveal>
          <section
            aria-labelledby="why-heading"
            className="mt-16 border-t border-border/60 pt-14"
          >
            <h2 id="why-heading" className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Built to be read, not just used
            </h2>

            <ul className="mt-8 grid gap-5 md:grid-cols-3">
              {HIGHLIGHTS.map(({ icon: Icon, title, body }, i) => (
                <li key={title}>
                  <Reveal delay={i * 90}>
                    <div className="h-full rounded-2xl border border-border/70 p-5">
                      <span className="grid size-9 place-items-center rounded-xl border border-accent/25 bg-accent/10 text-accent">
                        <Icon className="size-4" aria-hidden />
                      </span>
                      <p className="mt-4 font-medium">{title}</p>
                      <p className="mt-1.5 text-sm text-muted">{body}</p>
                    </div>
                  </Reveal>
                </li>
              ))}
            </ul>
          </section>
        </Reveal>

        <Reveal>
          <section
            aria-labelledby="demo-heading"
            className="surface-card mt-16 rounded-3xl p-6 sm:p-10"
          >
            <span className="grid size-10 place-items-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <ShieldAlert className="size-5" aria-hidden />
            </span>
            <h2
              id="demo-heading"
              className="mt-5 text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              Why nothing here can take your money
            </h2>
            <p className="mt-3 max-w-prose text-sm text-muted">
              This is a portfolio project, so the honest version matters more than a
              convincing one. Rates are real and fetched live, but no payment provider is
              ever contacted, the deposit addresses are malformed on purpose so no wallet
              will accept them, the card field is fixed to a published test number, and
              every request lives in your own browser. There is no server holding funds,
              because there are no funds.
            </p>
            <Link
              href="/history"
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline"
            >
              See the requests you have made
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </section>
        </Reveal>
      </PageContainer>
    </div>
  );
}
