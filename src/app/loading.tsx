"use client";

import { Loader2 } from "lucide-react";
import { useT } from "@/lib/i18n/context";

export default function Loading() {
  const t = useT();

  return (
    <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-24 sm:px-6 lg:px-8 text-sm text-muted">
      <Loader2 className="size-4 animate-spin text-accent" aria-hidden />
      {t("common.loading")}
    </div>
  );
}
