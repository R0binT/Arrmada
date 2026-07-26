import type { LibraryFilter } from "@/features/library/filter-library-items";
import { t } from "@/i18n";

const FILTER_KEYS: readonly LibraryFilter[] = [
  "all",
  "suivi",
  "aVenir",
  "aTelecharger",
  "dispo",
] as const;

const labelForFilter = (key: LibraryFilter): string => {
  switch (key) {
    case "all":
      return t("filter.all");
    case "suivi":
      return t("filter.suivi");
    case "aVenir":
      return t("availability.aVenir");
    case "aTelecharger":
      return t("availability.aTelecharger");
    case "dispo":
      return t("availability.dispo");
    default: {
      const _exhaustive: never = key;
      return _exhaustive;
    }
  }
};

export const getLibraryFilterChips = (): readonly {
  key: LibraryFilter;
  label: string;
}[] =>
  FILTER_KEYS.map((key) => ({
    key,
    label: labelForFilter(key),
  }));
