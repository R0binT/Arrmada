import { Pressable, StyleSheet, View } from "react-native";

import { useI18n } from "@/i18n";
import { useUiSize } from "@/lib/UiSizeProvider";
import { pressScaleStyle, Surface, Text, useReduceMotion } from "@/ui";

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
  const { space, minTouchTarget } = useUiSize();
  const reduceMotion = useReduceMotion();

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.rowPressable,
        pressScaleStyle(pressed, reduceMotion),
      ]}
    >
      <Surface
        radius="md"
        style={[
          styles.row,
          {
            gap: space.md,
            minHeight: minTouchTarget,
            paddingHorizontal: space.md,
            paddingVertical: space.md,
          },
        ]}
        tone="raised"
      >
        <View style={styles.copy}>
          <Text role="headline">{title}</Text>
          <Text role="caption" style={{ marginTop: space.xs }} tone="muted">
            {hint}
          </Text>
        </View>
        <Text role="body" tone="muted">
          ›
        </Text>
      </Surface>
    </Pressable>
  );
};

type SettingsBackRowProps = {
  readonly onPress: () => void;
};

export const SettingsBackRow = ({ onPress }: SettingsBackRowProps) => {
  const { t } = useI18n();
  const { space, minTouchTarget } = useUiSize();
  const reduceMotion = useReduceMotion();

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
        pressScaleStyle(pressed, reduceMotion),
      ]}
    >
      <Text role="label" tone="accent">
        ← {t("action.back")}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  rowPressable: {
    alignSelf: "stretch",
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
  },
  copy: {
    flex: 1,
  },
});
