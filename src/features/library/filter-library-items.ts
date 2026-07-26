import type { Availability } from "@/arr-client";
import { getI18nLocale, localeToBcp47 } from "@/i18n";

export type LibraryFilter =
  | "all"
  | "suivi"
  | "aVenir"
  | "aTelecharger"
  | "dispo";

type LibraryListItem = {
  readonly title: string;
  readonly monitored: boolean;
};

/** Shared Films / Séries library filter + A–Z sort (active UI locale). */
export const filterLibraryItems = <T extends LibraryListItem>(
  items: readonly T[],
  filter: LibraryFilter,
  search: string,
  classify: (item: T) => Availability,
): T[] => {
  const normalizedSearch = search.trim().toLowerCase();
  const sortLocale = localeToBcp47(getI18nLocale());

  return items
    .filter((item) => {
      if (filter === "suivi" && !item.monitored) return false;
      if (
        filter === "aVenir" ||
        filter === "aTelecharger" ||
        filter === "dispo"
      ) {
        if (classify(item) !== filter) return false;
      }
      if (!normalizedSearch) return true;
      return item.title.toLowerCase().includes(normalizedSearch);
    })
    .sort((left, right) =>
      left.title.localeCompare(right.title, sortLocale, {
        sensitivity: "base",
      }),
    );
};
