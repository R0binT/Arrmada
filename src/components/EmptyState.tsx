import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fonts, minTouchTarget, space } from "@/lib/theme";

type EmptyStateProps = {
  readonly title: string;
  readonly message: string;
  readonly actionLabel?: string;
  readonly onAction?: () => void;
};

export const EmptyState = ({
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) => {
  return (
    <View style={styles.container}>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Text style={styles.icon}>⬇</Text>
      </View>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          hitSlop={8}
          onPress={onAction}
          style={({ pressed }) => [styles.action, pressed ? styles.pressed : null]}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flex: 1,
    gap: space.md,
    justifyContent: "center",
    paddingHorizontal: space.xl,
    paddingVertical: space.xl,
  },
  icon: {
    color: colors.secondary,
    fontSize: 48,
    marginBottom: space.sm,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.uiBold,
    fontSize: 20,
    textAlign: "center",
  },
  message: {
    color: colors.secondary,
    fontFamily: fonts.ui,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  action: {
    marginTop: space.sm,
    minHeight: minTouchTarget,
    justifyContent: "center",
    paddingHorizontal: space.md,
  },
  actionText: {
    color: colors.accent,
    fontFamily: fonts.uiMedium,
    fontSize: 16,
  },
  pressed: {
    opacity: 0.8,
  },
});
