import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/guard";

export const metadata: Metadata = {
  title: "Rate alerts",
  description: "Demo rate alerts and limit orders, watched in your browser.",
};

export default async function Layout({ children }: { children: React.ReactNode }) {
  // Server-side gate: these pages list what belongs to one account, so the
  // check happens before any of it renders rather than after a flash.
  await requireUser("/alerts");
  return children;
}
