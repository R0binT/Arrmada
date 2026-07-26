import {
    Pressable,
    StyleSheet,
    Text,
    type StyleProp,
    type ViewStyle,
} from "react-native";

import { colors, radii } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";

type IconButtonProps = {
  readonly accessibilityLabel: string;
  readonly onPress: () => void;
  readonly icon: string;
  readonly variant?: "default" | "accent" | "outline";
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
  const variantStyle =
    variant === "accent"
      ? styles.accent
      : variant === "outline"
        ? styles.outline
        : styles.default;

  const textStyle =
    variant === "accent" || variant === "outline"
      ? styles.iconAccent
      : styles.iconDefault;

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
          minHeight: minTouchTarget,
          minWidth: minTouchTarget,
        },
        variantStyle,
        variant === "outline" ? { borderRadius: minTouchTarget / 2 } : null,
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
        style,
      ]}
    >
      <Text style={[textStyle, { fontSize: fontSize(16) }]}>{icon}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    alignSelf: "flex-start",
    justifyContent: "center",
    borderRadius: radii.md,
  },
  default: {
    backgroundColor: colors.surface,
  },
  accent: {
    backgroundColor: colors.accent,
  },
  outline: {
    backgroundColor: "transparent",
    borderColor: colors.accent,
    borderWidth: 1.5,
  },
  iconDefault: {
    color: colors.text,
    fontFamily: "Figtree_500Medium",
  },
  iconAccent: {
    color: colors.accent,
    fontFamily: "Figtree_500Medium",
  },
  pressed: {
    opacity: 0.75,
  },
  disabled: {
    opacity: 0.4,
  },
});
