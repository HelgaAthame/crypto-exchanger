import { describe, expect, it } from "vitest";
import { normalizeLocale, pickLocale, translate } from "../i18n/translate";

const en = { greeting: "Hello", pair: "{from} to {to}", only: "English only" };
const ru = { greeting: "Привет", pair: "{from} в {to}" };

describe("translate", () => {
  it("returns the string for the active locale", () => {
    expect(translate(ru, en, "greeting")).toBe("Привет");
  });

  it("falls back to English for a missing key", () => {
    expect(translate(ru, en, "only")).toBe("English only");
  });

  it("falls back to the key itself when nothing has it", () => {
    expect(translate(ru, en, "nope")).toBe("nope");
  });

  it("fills placeholders", () => {
    expect(translate(ru, en, "pair", { from: "BTC", to: "USD" })).toBe("BTC в USD");
  });

  it("accepts numbers as placeholder values", () => {
    expect(translate({ n: "{count} items" }, en, "n", { count: 3 })).toBe("3 items");
  });

  it("leaves a placeholder alone when no value is supplied", () => {
    expect(translate(ru, en, "pair", { from: "BTC" })).toBe("BTC в {to}");
  });

  it("returns the template untouched when there are no params", () => {
    expect(translate(ru, en, "pair")).toBe("{from} в {to}");
  });
});

describe("normalizeLocale", () => {
  it("accepts known locales", () => {
    expect(normalizeLocale("en")).toBe("en");
    expect(normalizeLocale("ru")).toBe("ru");
  });

  it("rejects anything else", () => {
    expect(normalizeLocale("de")).toBeNull();
    expect(normalizeLocale(null)).toBeNull();
    expect(normalizeLocale(undefined)).toBeNull();
  });
});

describe("pickLocale", () => {
  it("matches a regional variant to its base language", () => {
    expect(pickLocale(["ru-RU", "en-US"])).toBe("ru");
  });

  it("takes the first supported language in order of preference", () => {
    expect(pickLocale(["de", "en-GB", "ru"])).toBe("en");
  });

  it("defaults to English when nothing matches", () => {
    expect(pickLocale(["de", "fr"])).toBe("en");
    expect(pickLocale([])).toBe("en");
  });
});
