import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rate alerts",
  description: "Demo rate alerts watched in your browser while a tab is open.",
};

export default function AlertsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
