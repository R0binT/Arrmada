import type { ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

import { colors, elevation, radii } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";

type SurfaceProps = {
  readonly children: ReactNode;
  readonly tone?: "base" | "raised" | "elevated";
  readonly radius?: keyof typeof radii;
  readonly padded?: boolean;
  readonly style?: StyleProp<ViewStyle>;
};

export const Surface = ({
  children,
  tone = "base",
  radius = "lg",
  padded = false,
  style,
}: SurfaceProps) => {
  const { space: scaled } = useUiSize();
  const backgroundColor =
    tone === "elevated"
      ? colors.bgElevated
      : tone === "raised"
        ? colors.surfaceRaised
        : colors.surface;
  return (
    <View
      style={[
        {
          backgroundColor,
          borderColor: colors.borderSubtle,
          borderRadius: radii[radius],
          borderWidth: 1,
          ...(tone === "raised" || tone === "elevated" ? elevation.low : {}),
          ...(padded ? { padding: scaled.md } : {}),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};
