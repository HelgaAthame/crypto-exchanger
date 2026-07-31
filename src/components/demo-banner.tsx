"use client";

import { Info } from "lucide-react";
import { useT } from "@/lib/i18n/context";

export function DemoBanner() {
  const t = useT();

  return (
    <div className="w-full border-b border-accent/20 bg-linear-to-r from-transparent via-accent/10 to-transparent">
      <p className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-2 text-center text-xs sm:px-6 sm:text-sm lg:px-8">
        <Info className="size-3.5 shrink-0 text-accent" aria-hidden />
        <span>
          <span className="font-semibold text-accent">{t("banner.demo")}</span> —{" "}
          {t("banner.body")}
        </span>
      </p>
    </div>
  );
}
