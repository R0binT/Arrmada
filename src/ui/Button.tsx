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
  readonly loading?: boolean;
  readonly disabled?: boolean;
  readonly onPress: () => void;
  readonly children: ReactNode;
  readonly accessibilityLabel?: string;
  readonly style?: StyleProp<ViewStyle>;
};

export const Button = ({
  variant = "primary",
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

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: variantStyle.backgroundColor,
          borderColor: variantStyle.borderColor,
          borderWidth: variantStyle.borderWidth,
          borderRadius: radii.md,
          minHeight: minTouchTarget,
          paddingHorizontal: space.lg,
          paddingVertical: space.sm,
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
          role="label"
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
    alignSelf: "flex-start",
    justifyContent: "center",
  },
  label: {
    textAlign: "center",
  },
  disabled: {
    opacity: 0.4,
  },
});
