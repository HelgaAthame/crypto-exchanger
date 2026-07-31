"use client";

import { useT } from "@/lib/i18n/context";

export function SkipLink() {
  const t = useT();

  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-100 focus:rounded-xl focus:bg-card focus:px-4 focus:py-2.5 focus:text-sm focus:font-medium focus:ring-2 focus:ring-accent"
    >
      {t("nav.skip")}
    </a>
  );
}
