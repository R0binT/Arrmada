import { getLocales } from "expo-localization";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  loadLanguagePreference,
  saveLanguagePreference,
} from "@/i18n/language-preference";
import { resolveLocale } from "@/i18n/resolve-locale";
import { setI18nLocale, getI18nLocale, t, type MessageKey } from "@/i18n/t";
import type { AppLocale, LanguagePreference } from "@/i18n/types";

type I18nContextValue = {
  readonly preference: LanguagePreference;
  readonly locale: AppLocale;
  readonly isReady: boolean;
  readonly t: typeof t;
  readonly setPreference: (preference: LanguagePreference) => Promise<void>;
};

const I18nContext = createContext<I18nContextValue | null>(null);

const readDeviceLanguageCode = (): string | undefined => {
  const locales = getLocales();
  return locales[0]?.languageCode ?? undefined;
};

type I18nProviderProps = {
  readonly children: ReactNode;
};

export const I18nProvider = ({ children }: I18nProviderProps) => {
  const [preference, setPreferenceState] =
    useState<LanguagePreference>("system");
  const [isReady, setIsReady] = useState(false);
  const [deviceLanguageCode, setDeviceLanguageCode] = useState<
    string | undefined
  >(readDeviceLanguageCode);

  useEffect(() => {
    let cancelled = false;
    void loadLanguagePreference().then((stored) => {
      if (cancelled) {
        return;
      }
      setPreferenceState(stored);
      setDeviceLanguageCode(readDeviceLanguageCode());
      setIsReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const locale = useMemo(
    () => resolveLocale(preference, deviceLanguageCode),
    [preference, deviceLanguageCode],
  );

  if (getI18nLocale() !== locale) {
    setI18nLocale(locale);
  }

  const setPreference = useCallback(async (next: LanguagePreference) => {
    setPreferenceState(next);
    setDeviceLanguageCode(readDeviceLanguageCode());
    await saveLanguagePreference(next);
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      preference,
      locale,
      isReady,
      t,
      setPreference,
    }),
    [preference, locale, isReady, setPreference],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = (): I18nContextValue => {
  const value = useContext(I18nContext);
  if (!value) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return value;
};

export type { MessageKey };
