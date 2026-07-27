import { Pressable, View } from "react-native";

import type { LanguagePreference } from "@/i18n";
import { useI18n } from "@/i18n";
import { colors, radii } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";
import { pressScaleStyle, Surface, Text, useReduceMotion } from "@/ui";

const OPTIONS: readonly LanguagePreference[] = ["system", "fr", "en"];

export const LanguagePreferenceCard = () => {
  const { t, preference, setPreference } = useI18n();
  const { space, minTouchTarget } = useUiSize();
  const reduceMotion = useReduceMotion();

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
    <Surface
      padded
      radius="lg"
      style={{ gap: space.md, marginBottom: space.md }}
      tone="raised"
    >
      <Text role="headline">{t("settings.language")}</Text>
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
