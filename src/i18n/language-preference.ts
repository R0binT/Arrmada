import * as SecureStore from "expo-secure-store";

import type { LanguagePreference } from "@/i18n/types";

const KEY = "ui.languagePreference";

export const loadLanguagePreference =
  async (): Promise<LanguagePreference> => {
    const value = await SecureStore.getItemAsync(KEY);
    if (value === "fr" || value === "en" || value === "system") {
      return value;
    }
    return "system";
  };

export const saveLanguagePreference = async (
  preference: LanguagePreference,
): Promise<void> => {
  await SecureStore.setItemAsync(KEY, preference);
};
