import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to keep your requests, alerts and plans across devices.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
