import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { colors } from "@/lib/theme";

type ProgressBarProps = {
  readonly progress: number;
  readonly height?: number;
};

const clampProgress = (value: number): number => Math.min(1, Math.max(0, value));

export const ProgressBar = ({ progress, height = 4 }: ProgressBarProps) => {
  const animatedProgress = useSharedValue(clampProgress(progress));

  useEffect(() => {
    animatedProgress.value = withTiming(clampProgress(progress), { duration: 300 });
  }, [animatedProgress, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: animatedProgress.value }],
  }));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max: 100,
        now: Math.round(clampProgress(progress) * 100),
      }}
      style={[styles.track, { height, borderRadius: height / 2 }]}
    >
      <Animated.View
        style={[
          styles.fill,
          { height, borderRadius: height / 2 },
          fillStyle,
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    backgroundColor: colors.borderSubtle,
    overflow: "hidden",
    width: "100%",
  },
  fill: {
    backgroundColor: colors.accent,
    transformOrigin: "left",
    width: "100%",
  },
});
