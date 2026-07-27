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
  readonly disabled?: boolean;
  readonly style?: StyleProp<ViewStyle>;
};

export const IconButton = ({
  accessibilityLabel,
  onPress,
  icon,
  variant = "default",
  disabled = false,
  style,
}: IconButtonProps) => {
  const { fontSize, minTouchTarget } = useUiSize();
  const reduceMotion = useReduceMotion();
  const variantStyle = resolveIconButtonVariantStyle(variant);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: variantStyle.backgroundColor,
          borderColor: variantStyle.borderColor,
          borderWidth: variantStyle.borderWidth,
          borderRadius: variant === "outline" ? minTouchTarget / 2 : radii.md,
          minHeight: minTouchTarget,
          minWidth: minTouchTarget,
        },
        disabled ? styles.disabled : null,
        pressScaleStyle(pressed && !disabled, reduceMotion),
        style,
      ]}
    >
      <Text
        style={[
          styles.icon,
          { color: variantStyle.iconColor, fontSize: fontSize(16) },
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
