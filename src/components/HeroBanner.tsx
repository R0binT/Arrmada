import { Image } from "expo-image";
import { Pressable, StyleSheet, View } from "react-native";

import { ProgressBar } from "@/components/ProgressBar";
import { useI18n } from "@/i18n";
import { colors, radii } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";
import { Chip, pressScaleStyle, Text, useReduceMotion } from "@/ui";

export type HeroBannerKind = "download" | "movie" | "series";

type HeroBannerProps = {
  readonly title: string;
  readonly subtitle: string;
  readonly posterUrl: string | undefined;
  readonly progress?: number;
  readonly kind: HeroBannerKind;
  readonly onPress: () => void;
};

const HeroGradientOverlay = () => (
  <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    <View
      style={[
        styles.overlayStep,
        { height: "40%", opacity: 0.12, top: 0 },
      ]}
    />
    <View
      style={[
        styles.overlayStep,
        { height: "45%", opacity: 0.45, top: "30%" },
      ]}
    />
    <View
      style={[
        styles.overlayStep,
        { height: "55%", opacity: 0.72, top: "45%" },
      ]}
    />
    <View
      style={[
        styles.overlayStep,
        { backgroundColor: colors.bg, height: "30%", opacity: 0.55, top: "70%" },
      ]}
    />
  </View>
);

export const HeroBanner = ({
  title,
  subtitle,
  posterUrl,
  progress,
  kind,
  onPress,
}: HeroBannerProps) => {
  const { t } = useI18n();
  const { space, minTouchTarget, scale } = useUiSize();
  const reduceMotion = useReduceMotion();
  const hasProgress = progress !== undefined && progress > 0;
  const bannerMinHeight = Math.round(140 * scale);
  const ctaLabel =
    kind === "download"
      ? t("home.ctaQueue")
      : kind === "movie"
        ? t("home.ctaMovie")
        : t("home.ctaSeries");

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}. ${ctaLabel}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        { minHeight: bannerMinHeight },
        pressScaleStyle(pressed, reduceMotion),
      ]}
    >
      {posterUrl ? (
        <Image
          accessibilityIgnoresInvertColors
          contentFit="cover"
          source={{ uri: posterUrl }}
          style={StyleSheet.absoluteFill}
          transition={200}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.placeholder]} />
      )}
      <HeroGradientOverlay />
      <View
        style={{
          flex: 1,
          gap: space.xs,
          justifyContent: "flex-end",
          minHeight: bannerMinHeight,
          padding: space.md,
        }}
      >
        <Text role="title" style={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
          {title}
        </Text>
        <Text role="label" tone="muted">
          {subtitle}
        </Text>
        {hasProgress ? (
          <View style={{ marginTop: space.xs, maxWidth: 180 }}>
            <ProgressBar progress={progress} height={3} />
          </View>
        ) : null}
        <View
          style={{
            alignItems: "center",
            flexDirection: "row",
            gap: space.sm,
            marginTop: space.xs,
            minHeight: minTouchTarget,
          }}
        >
          <Chip tone="accent">{ctaLabel}</Chip>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.lg,
    overflow: "hidden",
  },
  placeholder: {
    backgroundColor: colors.surface,
  },
  overlayStep: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlay,
    left: 0,
    right: 0,
  },
});
