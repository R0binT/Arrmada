import { FadeIn, FadeInDown } from "react-native-reanimated";
import type { ViewStyle } from "react-native";

import { motion } from "@/lib/theme";

export const createFadeIn = (reduceMotion: boolean) => {
  if (reduceMotion) return undefined;
  return FadeIn.duration(motion.duration.normal);
};

export const createFadeSlideUp = (reduceMotion: boolean, index = 0) => {
  if (reduceMotion) return FadeIn.duration(motion.duration.fast);
  return FadeInDown.duration(motion.duration.normal).delay(
    Math.min(index * 40, 240),
  );
};

export const pressScaleStyle = (
  pressed: boolean,
  reduceMotion: boolean,
): ViewStyle => {
  if (!pressed) return {};
  if (reduceMotion) return { opacity: 0.92 };
  return { opacity: 0.92, transform: [{ scale: 0.97 }] };
};

export const sheetPresentDuration = (reduceMotion: boolean): number =>
  reduceMotion ? motion.duration.instant : motion.duration.normal;

export const sheetDismissDuration = (reduceMotion: boolean): number =>
  reduceMotion ? motion.duration.instant : motion.duration.fast;
