import { Pressable, StyleSheet, Text, View } from "react-native";

import { t } from "@/i18n";
import { colors, fonts, radii } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";

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
  const { space, fontSize, minTouchTarget } = useUiSize();

  return (
    <View
      accessibilityRole="alert"
      style={[styles.banner, { gap: space.md, padding: space.md }]}
    >
      <View style={[styles.header, { gap: space.sm }]}>
        <Text
          style={[
            styles.warningIcon,
            { fontSize: fontSize(20), lineHeight: fontSize(24) },
          ]}
        >
          ⚠
        </Text>
        <Text
          style={[
            styles.message,
            { fontSize: fontSize(15), lineHeight: fontSize(22) },
          ]}
        >
          {message}
        </Text>
      </View>
      {(onRetry || onSettings) && (
        <View style={[styles.actions, { gap: space.md }]}>
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
                pressed ? styles.pressed : null,
              ]}
            >
              <Text style={[styles.actionIcon, { fontSize: fontSize(14) }]}>
                ↻
              </Text>
              <Text style={[styles.actionText, { fontSize: fontSize(14) }]}>
                {t("error.retry")}
              </Text>
            </Pressable>
          ) : null}
          {onRetry && onSettings ? <View style={styles.divider} /> : null}
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
                pressed ? styles.pressed : null,
              ]}
            >
              <Text style={[styles.actionIcon, { fontSize: fontSize(14) }]}>
                ⚙
              </Text>
              <Text style={[styles.actionText, { fontSize: fontSize(14) }]}>
                {t("action.settings")}
              </Text>
            </Pressable>
          ) : null}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "rgba(196, 92, 74, 0.18)",
    borderColor: colors.accent,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
  },
  warningIcon: {
    color: colors.accent,
  },
  message: {
    color: colors.text,
    flex: 1,
    fontFamily: fonts.ui,
  },
  actions: {
    alignItems: "center",
    flexDirection: "row",
  },
  actionIcon: {
    color: colors.accent,
  },
  actionText: {
    color: colors.accent,
    fontFamily: fonts.uiMedium,
  },
  divider: {
    backgroundColor: colors.accent,
    height: 16,
    opacity: 0.4,
    width: 1,
  },
  pressed: {
    opacity: 0.75,
  },
});
