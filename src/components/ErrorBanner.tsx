import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fonts, minTouchTarget, radii, space } from "@/lib/theme";
import { t } from "@/i18n";

type ErrorBannerProps = {
  readonly message: string;
  readonly onRetry?: () => void;
  readonly onSettings?: () => void;
};

export const ErrorBanner = ({ message, onRetry, onSettings }: ErrorBannerProps) => {
  return (
    <View accessibilityRole="alert" style={styles.banner}>
      <View style={styles.header}>
        <Text style={styles.warningIcon}>⚠</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
      {(onRetry || onSettings) && (
        <View style={styles.actions}>
          {onRetry ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("error.retry")}
              hitSlop={8}
              onPress={onRetry}
              style={({ pressed }) => [styles.action, pressed ? styles.pressed : null]}
            >
              <Text style={styles.actionIcon}>↻</Text>
              <Text style={styles.actionText}>{t("error.retry")}</Text>
            </Pressable>
          ) : null}
          {onRetry && onSettings ? <View style={styles.divider} /> : null}
          {onSettings ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("error.openSettingsA11y")}
              hitSlop={8}
              onPress={onSettings}
              style={({ pressed }) => [styles.action, pressed ? styles.pressed : null]}
            >
              <Text style={styles.actionIcon}>⚙</Text>
              <Text style={styles.actionText}>{t("action.settings")}</Text>
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
    gap: space.md,
    padding: space.md,
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: space.sm,
  },
  warningIcon: {
    color: colors.accent,
    fontSize: 20,
    lineHeight: 24,
  },
  message: {
    color: colors.text,
    flex: 1,
    fontFamily: fonts.ui,
    fontSize: 15,
    lineHeight: 22,
  },
  actions: {
    alignItems: "center",
    flexDirection: "row",
    gap: space.md,
  },
  action: {
    alignItems: "center",
    flexDirection: "row",
    gap: space.xs,
    minHeight: minTouchTarget,
    paddingHorizontal: space.sm,
  },
  actionIcon: {
    color: colors.accent,
    fontSize: 14,
  },
  actionText: {
    color: colors.accent,
    fontFamily: fonts.uiMedium,
    fontSize: 14,
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
