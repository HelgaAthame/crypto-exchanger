import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live rates",
  description: "Current US dollar prices and 24-hour change for every supported currency.",
};

export default function RatesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
