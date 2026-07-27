import { useEffect } from "react";
import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { colors, radii } from "@/lib/theme";
import { useReduceMotion } from "@/ui/motion/use-reduce-motion";

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
  const reduceMotion = useReduceMotion();
  const opacity = useSharedValue(0.45);

  useEffect(() => {
    if (reduceMotion) {
      opacity.value = 0.65;
      return;
    }
    opacity.value = withRepeat(withTiming(0.85, { duration: 900 }), -1, true);
  }, [opacity, reduceMotion]);

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
