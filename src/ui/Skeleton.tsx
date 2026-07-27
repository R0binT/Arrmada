import { useEffect } from "react";
import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { colors, radii } from "@/lib/theme";

type SkeletonProps = {
  readonly width?: number | `${number}%`;
  readonly height: number;
  readonly borderRadius?: number;
  readonly style?: StyleProp<ViewStyle>;
};

export const Skeleton = ({
  width = "100%",
  height,
  borderRadius = radii.md,
  style,
}: SkeletonProps) => {
  const opacity = useSharedValue(0.45);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.85, { duration: 900 }), -1, true);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.block, { width, height, borderRadius }, animatedStyle, style]}
    />
  );
};

const styles = StyleSheet.create({
  block: {
    backgroundColor: colors.surface,
  },
});
