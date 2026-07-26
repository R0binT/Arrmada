import { setI18nLocale } from "@/i18n/t";

// Keep existing French assertions stable unless a test sets another locale.
setI18nLocale("fr");

jest.mock("expo-localization", () => ({
  getLocales: () => [{ languageCode: "fr", languageTag: "fr-FR" }],
}));

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
