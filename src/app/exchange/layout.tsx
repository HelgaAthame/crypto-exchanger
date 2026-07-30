import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Exchange request",
  description: "Simulated checkout and status for a demo exchange request.",
};

export default function ExchangeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
