import type { Availability } from "@/arr-client/availability";
import { t } from "@/i18n/t";

export const availabilityLabel = (availability: Availability): string => {
  switch (availability) {
    case "aVenir":
      return t("availability.aVenir");
    case "aTelecharger":
      return t("availability.aTelecharger");
    case "dispo":
      return t("availability.dispo");
    default: {
      const _exhaustive: never = availability;
      return _exhaustive;
    }
  }
};
