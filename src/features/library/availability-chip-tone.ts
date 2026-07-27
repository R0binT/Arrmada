import type { Availability } from "@/arr-client";
import type { ChipTone } from "@/ui/variant-styles";

/**
 * Shared availability → ChipTone mapping for detail, MediaQuick, and badges.
 */
export const availabilityChipTone = (
  availability: Availability | undefined,
): ChipTone => {
  switch (availability) {
    case "dispo":
      return "success";
    case "aTelecharger":
      return "info";
    case "aVenir":
      return "warning";
    case undefined:
      return "neutral";
    default: {
      const _exhaustive: never = availability;
      return _exhaustive;
    }
  }
};
