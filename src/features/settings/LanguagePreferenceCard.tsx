import { Pressable, Text, View } from "react-native";

import type { LanguagePreference } from "@/i18n";
import { useI18n } from "@/i18n";
import { colors, fonts, radii } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";

const OPTIONS: readonly LanguagePreference[] = ["system", "fr", "en"];

export const LanguagePreferenceCard = () => {
  const { t, preference, setPreference } = useI18n();
  const { space, fontSize, minTouchTarget } = useUiSize();

  const labelFor = (value: LanguagePreference): string => {
    switch (value) {
      case "system":
        return t("settings.languageSystem");
      case "fr":
        return t("settings.languageFr");
      case "en":
        return t("settings.languageEn");
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
        {t("settings.language")}
      </Text>
      <View
        accessibilityLabel={t("settings.languageA11y")}
        accessibilityRole="radiogroup"
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: space.sm,
        }}
      >
        {OPTIONS.map((option) => {
          const selected = preference === option;
          return (
            <Pressable
              key={option}
              accessibilityLabel={labelFor(option)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => void setPreference(option)}
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
                  opacity: pressed ? 0.85 : 1,
                },
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
