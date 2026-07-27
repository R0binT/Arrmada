import { View, type StyleProp, type ViewStyle } from "react-native";

import { colors } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";

type DividerProps = {
  readonly inset?: boolean;
  readonly style?: StyleProp<ViewStyle>;
};

export const Divider = ({ inset = false, style }: DividerProps) => {
  const { space } = useUiSize();

  return (
    <View
      accessibilityRole="none"
      style={[
        {
          backgroundColor: colors.borderSubtle,
          height: 1,
          marginHorizontal: inset ? space.md : 0,
          width: "100%",
        },
        style,
      ]}
    />
  );
};
