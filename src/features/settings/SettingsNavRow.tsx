import { Pressable, StyleSheet, Text, View } from "react-native";

import { useI18n } from "@/i18n";
import { useUiSize } from "@/lib/UiSizeProvider";
import { colors, fonts, radii } from "@/lib/theme";

type SettingsNavRowProps = {
  readonly title: string;
  readonly hint: string;
  readonly accessibilityLabel: string;
  readonly onPress: () => void;
};

export const SettingsNavRow = ({
  title,
  hint,
  accessibilityLabel,
  onPress,
}: SettingsNavRowProps) => {
  const { space, fontSize, minTouchTarget } = useUiSize();

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        {
          alignItems: "center",
          backgroundColor: colors.surface,
          borderColor: "rgba(244, 240, 232, 0.08)",
          borderRadius: radii.md,
          borderWidth: 1,
          flexDirection: "row",
          gap: space.md,
          minHeight: minTouchTarget,
          paddingHorizontal: space.md,
          paddingVertical: space.md,
        },
        pressed ? styles.pressed : null,
      ]}
    >
      <View style={styles.copy}>
        <Text
          style={{
            color: colors.text,
            fontFamily: fonts.uiMedium,
            fontSize: fontSize(16),
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            color: colors.secondary,
            fontFamily: fonts.ui,
            fontSize: fontSize(13),
            marginTop: space.xs,
          }}
        >
          {hint}
        </Text>
      </View>
      <Text
        style={{
          color: colors.secondary,
          fontFamily: fonts.ui,
          fontSize: fontSize(20),
        }}
      >
        ›
      </Text>
    </Pressable>
  );
};

type SettingsBackRowProps = {
  readonly onPress: () => void;
};

export const SettingsBackRow = ({ onPress }: SettingsBackRowProps) => {
  const { t } = useI18n();
  const { space, fontSize, minTouchTarget } = useUiSize();

  return (
    <Pressable
      accessibilityLabel={t("action.back")}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        {
          alignSelf: "flex-start",
          justifyContent: "center",
          marginBottom: space.md,
          minHeight: minTouchTarget,
          paddingVertical: space.xs,
        },
        pressed ? styles.pressed : null,
      ]}
    >
      <Text
        style={{
          color: colors.accent,
          fontFamily: fonts.uiMedium,
          fontSize: fontSize(15),
        }}
      >
        ← {t("action.back")}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  copy: {
    flex: 1,
  },
  pressed: {
    opacity: 0.75,
  },
});
