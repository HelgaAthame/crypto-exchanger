import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { DemoBanner } from "@/components/demo-banner";
import { NavBar } from "@/components/nav-bar";
import { RatesTicker } from "@/components/rates-ticker";
import { AlertsWatcher } from "@/components/alerts-watcher";
import { SkipLink } from "@/components/skip-link";
import { SyncBoot } from "@/components/sync-boot";
import { LocaleProvider } from "@/lib/i18n/context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Crypto Exchanger — demo exchange calculator",
    template: "%s · Crypto Exchanger",
  },
  description:
    "A portfolio demo project: live fiat/crypto exchange rate calculator. No real funds are transferred.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          <LocaleProvider>
            <SkipLink />
            <DemoBanner />
            <NavBar />
            <RatesTicker />
            <main id="main" tabIndex={-1} className="flex-1 scroll-mt-24">
              {children}
            </main>
            <AlertsWatcher />
            <SyncBoot />
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
