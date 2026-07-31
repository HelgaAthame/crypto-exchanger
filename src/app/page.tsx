"use client";

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
import { useT } from "@/lib/i18n/context";

const HIGHLIGHTS = [
  { icon: Receipt, key: "home.highlight1" },
  { icon: Gauge, key: "home.highlight2" },
  { icon: UserRoundCheck, key: "home.highlight3" },
];

const STEPS = [
  { icon: Calculator, key: "home.step1" },
  { icon: Wallet, key: "home.step2" },
  { icon: LineChart, key: "home.step3" },
];

export default function Home() {
  const t = useT();

  return (
    <div className="relative">
      <section className="relative overflow-hidden">
        <HeroBackdrop />

        <PageContainer className="relative grid items-center gap-12 pb-16 pt-14 lg:grid-cols-[1fr_minmax(0,28rem)] lg:gap-16 lg:pb-24 lg:pt-20">
          <div className="rise-in order-2 lg:order-1">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-accent">
              <Zap className="size-3" aria-hidden />
              {t("home.badge")}
            </span>

            <h1 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              {t("home.title")}
              <br />
              <span className="gold-text">{t("home.titleAccent")}</span>
            </h1>

            <p className="mt-5 max-w-prose text-base text-muted sm:text-lg">
              {t("home.subtitle")}
            </p>

            <div className="mt-8 flex flex-wrap gap-2.5">
              <Link
                href="/rates"
                className="sheen-border inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-medium transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 active:translate-y-0"
              >
                {t("home.browseRates")}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link
                href="/alerts"
                className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-muted transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
              >
                <BellRing className="size-4" aria-hidden />
                {t("home.setAlert")}
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
              {t("home.howTitle")}
            </h2>
            <p className="mt-2 max-w-prose text-sm text-muted">{t("home.howSubtitle")}</p>

            <ol className="mt-8 grid gap-5 md:grid-cols-3">
              {STEPS.map(({ icon: Icon, key }, i) => (
                <li key={key}>
                  <Reveal delay={i * 90}>
                    <div className="surface-card h-full rounded-2xl p-5">
                      <span className="flex items-center gap-2.5">
                        <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-accent/25 bg-accent/10 text-accent">
                          <Icon className="size-4" aria-hidden />
                        </span>
                        <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
                          {t("home.step", { n: i + 1 })}
                        </span>
                      </span>
                      <p className="mt-4 font-medium">{t(`${key}.title`)}</p>
                      <p className="mt-1.5 text-sm text-muted">{t(`${key}.body`)}</p>
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
              {t("home.whyTitle")}
            </h2>

            <ul className="mt-8 grid gap-5 md:grid-cols-3">
              {HIGHLIGHTS.map(({ icon: Icon, key }, i) => (
                <li key={key}>
                  <Reveal delay={i * 90}>
                    <div className="h-full rounded-2xl border border-border/70 p-5">
                      <span className="grid size-9 place-items-center rounded-xl border border-accent/25 bg-accent/10 text-accent">
                        <Icon className="size-4" aria-hidden />
                      </span>
                      <p className="mt-4 font-medium">{t(`${key}.title`)}</p>
                      <p className="mt-1.5 text-sm text-muted">{t(`${key}.body`)}</p>
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
              {t("home.demoTitle")}
            </h2>
            <p className="mt-3 max-w-prose text-sm text-muted">{t("home.demoBody")}</p>
            <Link
              href="/history"
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline"
            >
              {t("home.seeRequests")}
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </section>
        </Reveal>
      </PageContainer>
    </div>
  );
}
