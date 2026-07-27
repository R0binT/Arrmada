import type { ViewStyle } from "react-native";

import type { LibraryFilter } from "@/features/library/filter-library-items";
import { colors } from "@/lib/theme";

export type LibraryFilterChipVisual = {
  readonly container: ViewStyle;
  readonly labelColor: string;
};

/**
 * Inactive tint + clear active fill per library filter key.
 */
export const resolveLibraryFilterChipStyle = (
  key: LibraryFilter,
  isActive: boolean,
): LibraryFilterChipVisual => {
  if (isActive) {
    switch (key) {
      case "dispo":
        return {
          container: {
            backgroundColor: colors.success,
            borderColor: colors.success,
          },
          labelColor: colors.bg,
        };
      case "aVenir":
        return {
          container: {
            backgroundColor: colors.warning,
            borderColor: colors.warning,
          },
          labelColor: colors.bg,
        };
      case "aTelecharger":
        return {
          container: {
            backgroundColor: colors.info,
            borderColor: colors.info,
          },
          labelColor: colors.bg,
        };
      case "suivi":
      case "all":
        return {
          container: {
            backgroundColor: colors.accent,
            borderColor: colors.accent,
          },
          labelColor: colors.bg,
        };
      default: {
        const _exhaustive: never = key;
        return _exhaustive;
      }
    }
  }

  switch (key) {
    case "dispo":
      return {
        container: {
          backgroundColor: colors.successMuted,
          borderColor: colors.success,
        },
        labelColor: colors.success,
      };
    case "aVenir":
      return {
        container: {
          backgroundColor: colors.warningMuted,
          borderColor: colors.warning,
        },
        labelColor: colors.warning,
      };
    case "aTelecharger":
      return {
        container: {
          backgroundColor: colors.infoMuted,
          borderColor: colors.info,
        },
        labelColor: colors.info,
      };
    case "suivi":
      return {
        container: {
          backgroundColor: colors.accentMuted,
          borderColor: colors.borderInput,
        },
        labelColor: colors.accent,
      };
    case "all":
      return {
        container: {
          backgroundColor: "transparent",
          borderColor: colors.borderInput,
        },
        labelColor: colors.textMuted,
      };
    default: {
      const _exhaustive: never = key;
      return _exhaustive;
    }
  }
};
