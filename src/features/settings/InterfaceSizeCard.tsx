import { Pressable, StyleSheet, Text, View } from "react-native";

import { useI18n } from "@/i18n";
import { useUiSize } from "@/lib/UiSizeProvider";
import { colors, fonts, radii } from "@/lib/theme";
import type { UiSizeId } from "@/lib/ui-size";
import { UI_SIZE_IDS } from "@/lib/ui-size";

export const InterfaceSizeCard = () => {
  const { t } = useI18n();
  const { size, setSize, space, fontSize, minTouchTarget } = useUiSize();

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
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: radii.lg,
        gap: space.md,
        marginBottom: space.md,
        padding: space.md,
      }}
    >
      <Text
        style={{
          color: colors.text,
          fontFamily: fonts.display,
          fontSize: fontSize(20),
        }}
      >
        {t("settings.uiSize")}
      </Text>
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
                  borderColor: selected
                    ? colors.accent
                    : "rgba(244, 240, 232, 0.12)",
                  borderRadius: radii.md,
                  borderWidth: 1,
                  backgroundColor: selected
                    ? "rgba(245, 165, 36, 0.18)"
                    : "transparent",
                  justifyContent: "center",
                  minHeight: minTouchTarget,
                  paddingHorizontal: space.md,
                },
                pressed ? styles.pressed : null,
              ]}
            >
              <Text
                style={{
                  color: selected ? colors.accent : colors.secondary,
                  fontFamily: fonts.uiMedium,
                  fontSize: fontSize(14),
                }}
              >
                {labelFor(option)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.85,
  },
});
