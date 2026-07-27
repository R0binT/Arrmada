import { Pressable, View } from "react-native";

import { t } from "@/i18n";
import { colors } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";
import { pressScaleStyle, Surface, Text, useReduceMotion } from "@/ui";

type ErrorBannerProps = {
  readonly message: string;
  readonly onRetry?: () => void;
  readonly onSettings?: () => void;
};

export const ErrorBanner = ({
  message,
  onRetry,
  onSettings,
}: ErrorBannerProps) => {
  const { space, minTouchTarget } = useUiSize();
  const reduceMotion = useReduceMotion();

  return (
    <View accessibilityRole="alert">
      <Surface
        padded
        radius="md"
        style={{
          backgroundColor: colors.dangerMuted,
          borderColor: colors.danger,
          gap: space.md,
        }}
        tone="base"
      >
      <View style={{ alignItems: "flex-start", flexDirection: "row", gap: space.sm }}>
        <Text role="headline" tone="danger">
          ⚠
        </Text>
        <Text role="body" style={{ flex: 1 }}>
          {message}
        </Text>
      </View>
      {(onRetry || onSettings) && (
        <View style={{ alignItems: "center", flexDirection: "row", gap: space.md }}>
          {onRetry ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("error.retry")}
              hitSlop={8}
              onPress={onRetry}
              style={({ pressed }) => [
                {
                  alignItems: "center",
                  flexDirection: "row",
                  gap: space.xs,
                  minHeight: minTouchTarget,
                  paddingHorizontal: space.sm,
                },
                pressScaleStyle(pressed, reduceMotion),
              ]}
            >
              <Text role="label" tone="danger">
                ↻
              </Text>
              <Text role="label" tone="danger">
                {t("error.retry")}
              </Text>
            </Pressable>
          ) : null}
          {onRetry && onSettings ? (
            <View
              style={{
                backgroundColor: colors.danger,
                height: 16,
                opacity: 0.4,
                width: 1,
              }}
            />
          ) : null}
          {onSettings ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("error.openSettingsA11y")}
              hitSlop={8}
              onPress={onSettings}
              style={({ pressed }) => [
                {
                  alignItems: "center",
                  flexDirection: "row",
                  gap: space.xs,
                  minHeight: minTouchTarget,
                  paddingHorizontal: space.sm,
                },
                pressScaleStyle(pressed, reduceMotion),
              ]}
            >
              <Text role="label" tone="danger">
                ⚙
              </Text>
              <Text role="label" tone="danger">
                {t("action.settings")}
              </Text>
            </Pressable>
          ) : null}
        </View>
      )}
      </Surface>
    </View>
  );
};
