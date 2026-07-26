import { resolveLocale } from "@/i18n/resolve-locale";

describe("resolveLocale", () => {
  it("honors explicit French preference", () => {
    expect(resolveLocale("fr", "en")).toBe("fr");
  });

  it("honors explicit English preference", () => {
    expect(resolveLocale("en", "fr")).toBe("en");
  });

  it("uses French when system and device is fr", () => {
    expect(resolveLocale("system", "fr")).toBe("fr");
    expect(resolveLocale("system", "fr-BE")).toBe("fr");
  });

  it("falls back to English for non-French device locales", () => {
    expect(resolveLocale("system", "en")).toBe("en");
    expect(resolveLocale("system", "de")).toBe("en");
    expect(resolveLocale("system", undefined)).toBe("en");
    expect(resolveLocale("system", "")).toBe("en");
  });
});
