import type { AppLocale, LanguagePreference } from "@/i18n/types";

/**
 * Resolve UI locale: explicit preference wins; system uses device language
 * (fr* → fr, otherwise en).
 */
export const resolveLocale = (
  preference: LanguagePreference,
  deviceLanguageCode: string | null | undefined,
): AppLocale => {
  if (preference === "fr" || preference === "en") {
    return preference;
  }
  const code = (deviceLanguageCode ?? "").trim().toLowerCase();
  if (code === "fr" || code.startsWith("fr-")) {
    return "fr";
  }
  return "en";
};

export const localeToBcp47 = (locale: AppLocale): string =>
  locale === "fr" ? "fr-FR" : "en-US";
