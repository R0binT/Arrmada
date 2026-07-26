import { enMessages } from "@/i18n/locales/en";
import { frMessages } from "@/i18n/locales/fr";
import type { MessageKey } from "@/i18n/message-key";
import type { AppLocale } from "@/i18n/types";

export type { MessageKey };

const catalogs: Record<AppLocale, Record<MessageKey, string>> = {
  fr: frMessages,
  en: enMessages,
};

let activeLocale: AppLocale = "en";

export const getI18nLocale = (): AppLocale => activeLocale;

export const setI18nLocale = (locale: AppLocale): void => {
  activeLocale = locale;
};

const interpolate = (
  template: string,
  params?: Readonly<Record<string, string | number>>,
): string => {
  if (!params) {
    return template;
  }
  return template.replace(/\{\{(\w+)\}\}/g, (_match, name: string) => {
    const value = params[name];
    return value === undefined ? `{{${name}}}` : String(value);
  });
};

/** Translate a message key for the active locale (EN fallback). */
export const t = (
  key: MessageKey,
  params?: Readonly<Record<string, string | number>>,
): string => {
  const primary = catalogs[activeLocale][key] ?? catalogs.en[key] ?? key;
  return interpolate(primary, params);
};
