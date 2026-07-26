import {
    Pressable,
    StyleSheet,
    Text,
    type StyleProp,
    type ViewStyle,
} from "react-native";

import { colors, minTouchTarget, radii } from "@/lib/theme";

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
        variantStyle,
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
        style,
      ]}
    >
      <Text style={textStyle}>{icon}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    alignSelf: "flex-start",
    justifyContent: "center",
    minHeight: minTouchTarget,
    minWidth: minTouchTarget,
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
    borderRadius: minTouchTarget / 2,
  },
  iconDefault: {
    color: colors.text,
    fontSize: 16,
    fontFamily: "Figtree_500Medium",
  },
  iconAccent: {
    color: colors.accent,
    fontSize: 16,
    fontFamily: "Figtree_500Medium",
  },
  pressed: {
    opacity: 0.75,
  },
  disabled: {
    opacity: 0.4,
  },
});
