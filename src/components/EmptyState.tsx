import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, fonts } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";

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
  const { space, fontSize, minTouchTarget } = useUiSize();

  return (
    <View
      style={{
        alignItems: "center",
        flex: 1,
        gap: space.md,
        justifyContent: "center",
        paddingHorizontal: space.xl,
        paddingVertical: space.xl,
      }}
    >
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Text
          style={[
            styles.icon,
            { fontSize: fontSize(48), marginBottom: space.sm },
          ]}
        >
          ⬇
        </Text>
      </View>
      <Text
        accessibilityRole="header"
        style={[styles.title, { fontSize: fontSize(20) }]}
      >
        {title}
      </Text>
      <Text
        style={[
          styles.message,
          { fontSize: fontSize(15), lineHeight: fontSize(22) },
        ]}
      >
        {message}
      </Text>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          hitSlop={8}
          onPress={onAction}
          style={({ pressed }) => [
            {
              justifyContent: "center",
              marginTop: space.sm,
              minHeight: minTouchTarget,
              paddingHorizontal: space.md,
            },
            pressed ? styles.pressed : null,
          ]}
        >
          <Text style={[styles.actionText, { fontSize: fontSize(16) }]}>
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  icon: {
    color: colors.secondary,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.uiBold,
    textAlign: "center",
  },
  message: {
    color: colors.secondary,
    fontFamily: fonts.ui,
    textAlign: "center",
  },
  actionText: {
    color: colors.accent,
    fontFamily: fonts.uiMedium,
  },
  pressed: {
    opacity: 0.8,
  },
});
