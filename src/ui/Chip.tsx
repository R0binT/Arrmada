import type { ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

import { radii } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";
import { Text } from "@/ui/Text";
import { resolveChipToneStyle, type ChipTone } from "@/ui/variant-styles";

type ChipProps = {
  readonly tone?: ChipTone;
  readonly children: ReactNode;
  readonly style?: StyleProp<ViewStyle>;
};

export const Chip = ({
  tone = "neutral",
  children,
  style,
}: ChipProps) => {
  const { space } = useUiSize();
  const toneStyle = resolveChipToneStyle(tone);

  return (
    <View
      style={[
        {
          alignSelf: "flex-start",
          backgroundColor: toneStyle.backgroundColor,
          borderColor: toneStyle.borderColor,
          borderRadius: radii.full,
          borderWidth: 1,
          paddingHorizontal: space.sm,
          paddingVertical: space["2xs"],
        },
        style,
      ]}
    >
      <Text role="caption" style={{ color: toneStyle.labelColor }}>
        {children}
      </Text>
    </View>
  );
};
