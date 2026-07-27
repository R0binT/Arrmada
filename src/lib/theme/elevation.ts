import { Platform, type ViewStyle } from "react-native";

import { colors } from "@/lib/theme/colors";

export const elevation = {
  none: {} as ViewStyle,
  low: Platform.select<ViewStyle>({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
    },
    android: { elevation: 2 },
    default: {},
  })!,
  mid: Platform.select<ViewStyle>({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 14,
    },
    android: { elevation: 6 },
    default: {},
  })!,
  glowAccent: {
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    ...(Platform.OS === "android" ? { elevation: 4 } : {}),
  } as ViewStyle,
} as const;
