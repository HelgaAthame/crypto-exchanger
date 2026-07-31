"use client";

import { createContext, useCallback, useContext, useEffect, useSyncExternalStore } from "react";
import { DICTIONARIES, en } from "@/lib/i18n/dictionaries";
import {
  LOCALES,
  normalizeLocale,
  pickLocale,
  translate,
  type Locale,
} from "@/lib/i18n/translate";

const STORAGE_KEY = "crypto-exchanger:locale";

const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function getSnapshot(): Locale {
  const stored = normalizeLocale(window.localStorage.getItem(STORAGE_KEY));
  if (stored) return stored;
  return pickLocale(navigator.languages ?? [navigator.language]);
}

/** The server has neither storage nor a browser language, so it renders English. */
function getServerSnapshot(): Locale {
  return "en";
}

type Translate = (key: string, params?: Record<string, string | number>) => string;

const LocaleContext = createContext<{
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translate;
}>({ locale: "en", setLocale: () => {}, t: (key) => en[key] ?? key });

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  // An external store rather than state seeded in an effect: the preference
  // lives outside React, and this keeps the server render ("en") from being
  // followed by a cascading re-render on mount.
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    document.documentElement.lang =
      LOCALES.find((l) => l.id === locale)?.htmlLang ?? "en";
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    for (const listener of listeners) listener();
  }, []);

  const t = useCallback<Translate>(
    (key, params) => translate(DICTIONARIES[locale], en, key, params),
    [locale]
  );

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}

/** Shorthand for components that only need the translate function. */
export function useT(): Translate {
  return useContext(LocaleContext).t;
}
