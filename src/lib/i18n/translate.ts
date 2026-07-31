export type Locale = "en" | "ru";

export const LOCALES: { id: Locale; label: string; htmlLang: string }[] = [
  { id: "en", label: "EN", htmlLang: "en" },
  { id: "ru", label: "RU", htmlLang: "ru" },
];

export type Dictionary = Record<string, string>;

/**
 * Looks up `key` and fills `{placeholders}`.
 *
 * A missing key falls back to the English string, and failing that to the key
 * itself — a half-translated UI should degrade to readable English rather than
 * render an empty space where a label belongs.
 */
export function translate(
  dictionary: Dictionary,
  fallback: Dictionary,
  key: string,
  params?: Record<string, string | number>
): string {
  const template = dictionary[key] ?? fallback[key] ?? key;
  if (!params) return template;

  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match
  );
}

/** Reads a stored preference, ignoring anything that is not a known locale. */
export function normalizeLocale(value: string | null | undefined): Locale | null {
  return LOCALES.some((l) => l.id === value) ? (value as Locale) : null;
}

/** Picks the closest supported locale for a browser language list. */
export function pickLocale(languages: readonly string[]): Locale {
  for (const language of languages) {
    const base = language.toLowerCase().split("-")[0];
    const match = LOCALES.find((l) => l.id === base);
    if (match) return match.id;
  }
  return "en";
}
