import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recurring buys",
  description: "Demo recurring purchase plans, stored in your browser.",
};

export default function RecurringLayout({ children }: { children: React.ReactNode }) {
  return children;
}
