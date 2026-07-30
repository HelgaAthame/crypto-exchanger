import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Request history",
  description: "Demo exchange requests created in this browser.",
};

export default function HistoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
