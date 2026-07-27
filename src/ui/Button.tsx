import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { colors, radii } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";
import { pressScaleStyle } from "@/ui/motion/presets";
import { useReduceMotion } from "@/ui/motion/use-reduce-motion";
import { Text } from "@/ui/Text";
import {
  resolveButtonVariantStyle,
  type ButtonVariant,
} from "@/ui/variant-styles";

type ButtonProps = {
  readonly variant?: ButtonVariant;
  readonly size?: "default" | "compact";
  readonly loading?: boolean;
  readonly disabled?: boolean;
  readonly onPress: () => void;
  readonly children: ReactNode;
  readonly accessibilityLabel?: string;
  readonly style?: StyleProp<ViewStyle>;
};

export const Button = ({
  variant = "primary",
  size = "default",
  loading = false,
  disabled = false,
  onPress,
  children,
  accessibilityLabel,
  style,
}: ButtonProps) => {
  const { minTouchTarget, space } = useUiSize();
  const reduceMotion = useReduceMotion();
  const variantStyle = resolveButtonVariantStyle(variant);
  const isDisabled = disabled || loading;
  const isCompact = size === "compact";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      hitSlop={isCompact ? 10 : 8}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: variantStyle.backgroundColor,
          borderColor: variantStyle.borderColor,
          borderWidth: variantStyle.borderWidth,
          borderRadius: isCompact ? radii.full : radii.md,
          minHeight: isCompact ? undefined : minTouchTarget,
          paddingHorizontal: isCompact ? space.sm : space.lg,
          paddingVertical: isCompact ? space.xs : space.sm,
          alignSelf: isCompact ? "center" : "flex-start",
        },
        isDisabled ? styles.disabled : null,
        pressScaleStyle(pressed && !isDisabled, reduceMotion),
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variantStyle.labelColor} />
      ) : (
        <Text
          role={isCompact ? "caption" : "label"}
          style={[styles.label, { color: variantStyle.labelColor }]}
        >
          {children}
        </Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    textAlign: "center",
  },
  disabled: {
    opacity: 0.4,
  },
});
