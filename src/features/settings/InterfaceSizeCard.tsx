import { Pressable, View } from "react-native";

import { useI18n } from "@/i18n";
import { colors, radii } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";
import type { UiSizeId } from "@/lib/ui-size";
import { UI_SIZE_IDS } from "@/lib/ui-size";
import { pressScaleStyle, Surface, Text, useReduceMotion } from "@/ui";

export const InterfaceSizeCard = () => {
  const { t } = useI18n();
  const { size, setSize, space, minTouchTarget } = useUiSize();
  const reduceMotion = useReduceMotion();

  const labelFor = (value: UiSizeId): string => {
    switch (value) {
      case "compact":
        return t("settings.uiSizeCompact");
      case "normal":
        return t("settings.uiSizeNormal");
      case "comfortable":
        return t("settings.uiSizeComfortable");
      default: {
        const _exhaustive: never = value;
        return _exhaustive;
      }
    }
  };

  return (
    <Surface
      padded
      radius="lg"
      style={{ gap: space.md, marginBottom: space.md }}
      tone="raised"
    >
      <Text role="headline">{t("settings.uiSize")}</Text>
      <View
        accessibilityLabel={t("settings.uiSizeA11y")}
        accessibilityRole="radiogroup"
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: space.sm,
        }}
      >
        {UI_SIZE_IDS.map((option) => {
          const selected = size === option;
          return (
            <Pressable
              key={option}
              accessibilityLabel={labelFor(option)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => void setSize(option)}
              style={({ pressed }) => [
                {
                  alignItems: "center",
                  borderColor: selected ? colors.accent : colors.borderStrong,
                  borderRadius: radii.md,
                  borderWidth: 1,
                  backgroundColor: selected
                    ? colors.accentMuted
                    : "transparent",
                  justifyContent: "center",
                  minHeight: minTouchTarget,
                  paddingHorizontal: space.md,
                },
                pressScaleStyle(pressed, reduceMotion),
              ]}
            >
              <Text role="label" tone={selected ? "accent" : "muted"}>
                {labelFor(option)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Surface>
  );
};
