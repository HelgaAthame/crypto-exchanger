"use client";

import { useLocale } from "@/lib/i18n/context";
import { LOCALES } from "@/lib/i18n/translate";

export function LanguageToggle() {
  const { locale, setLocale, t } = useLocale();

  return (
    <div
      role="group"
      aria-label={t("nav.language")}
      className="flex items-center rounded-full border border-border/70 p-0.5 text-[11px] font-medium"
    >
      {LOCALES.map(({ id, label }) => {
        const isActive = id === locale;
        return (
          <button
            key={id}
            type="button"
            lang={id}
            aria-pressed={isActive}
            onClick={() => setLocale(id)}
            className={`rounded-full px-2 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
              isActive ? "bg-accent/15 text-accent" : "text-muted hover:text-foreground"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
