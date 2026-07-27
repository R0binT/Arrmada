import {
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { fonts, radii } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";
import { pressScaleStyle } from "@/ui/motion/presets";
import { useReduceMotion } from "@/ui/motion/use-reduce-motion";
import {
  resolveIconButtonVariantStyle,
  type IconButtonVariant,
} from "@/ui/variant-styles";

type IconButtonProps = {
  readonly accessibilityLabel: string;
  readonly onPress: () => void;
  readonly icon: string;
  readonly variant?: IconButtonVariant;
  readonly size?: "default" | "compact";
  readonly disabled?: boolean;
  readonly style?: StyleProp<ViewStyle>;
};

export const IconButton = ({
  accessibilityLabel,
  onPress,
  icon,
  variant = "default",
  size = "default",
  disabled = false,
  style,
}: IconButtonProps) => {
  const { fontSize, minTouchTarget, space } = useUiSize();
  const reduceMotion = useReduceMotion();
  const variantStyle = resolveIconButtonVariantStyle(variant);
  const isCompact = size === "compact";
  const side = isCompact ? Math.round(minTouchTarget * 0.72) : minTouchTarget;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={isCompact ? 10 : 8}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: variantStyle.backgroundColor,
          borderColor: variantStyle.borderColor,
          borderWidth: variantStyle.borderWidth,
          borderRadius: variant === "outline" ? side / 2 : radii.md,
          minHeight: side,
          minWidth: side,
          paddingHorizontal: isCompact ? space["2xs"] : 0,
        },
        disabled ? styles.disabled : null,
        pressScaleStyle(pressed && !disabled, reduceMotion),
        style,
      ]}
    >
      <Text
        style={[
          styles.icon,
          {
            color: variantStyle.iconColor,
            fontSize: fontSize(isCompact ? 12 : 16),
          },
        ]}
      >
        {icon}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    alignSelf: "flex-start",
    justifyContent: "center",
  },
  icon: {
    fontFamily: fonts.uiMedium,
  },
  disabled: {
    opacity: 0.4,
  },
});
