import { Image } from "expo-image";
import { Pressable, StyleSheet, View } from "react-native";

import { ProgressBar } from "@/components/ProgressBar";
import { useI18n } from "@/i18n";
import { colors, elevation, radii } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";
import { pressScaleStyle, Text, useReduceMotion } from "@/ui";

export type HeroBannerKind = "download" | "movie" | "series";

type HeroBannerProps = {
  readonly title: string;
  readonly subtitle: string;
  readonly posterUrl: string | undefined;
  readonly progress?: number;
  readonly kind: HeroBannerKind;
  readonly onPress: () => void;
  /** Full-bleed cinema hero vs inset card. Default cinema. */
  readonly layout?: "cinema" | "card";
};

const HeroGradientOverlay = () => (
  <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    <View style={[styles.overlayStep, styles.overlayTop]} />
    <View style={[styles.overlayStep, styles.overlayMid]} />
    <View style={[styles.overlayStep, styles.overlayLow]} />
    <View style={[styles.overlayStep, styles.overlayBottom]} />
    <View style={styles.accentWash} />
  </View>
);

export const HeroBanner = ({
  title,
  subtitle,
  posterUrl,
  progress,
  kind,
  onPress,
  layout = "cinema",
}: HeroBannerProps) => {
  const { t } = useI18n();
  const { space, scale } = useUiSize();
  const reduceMotion = useReduceMotion();
  const hasProgress = progress !== undefined && progress > 0;
  const bannerMinHeight = Math.round((layout === "cinema" ? 360 : 180) * scale);
  const ctaLabel =
    kind === "download"
      ? t("home.ctaQueue")
      : kind === "movie"
        ? t("home.ctaMovie")
        : t("home.ctaSeries");
  const kindLabel =
    kind === "download"
      ? t("tabs.downloads")
      : kind === "movie"
        ? t("tabs.movies")
        : t("tabs.series");

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}. ${ctaLabel}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        layout === "card" ? styles.card : styles.cinema,
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
          transition={220}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.placeholder]} />
      )}
      <HeroGradientOverlay />
      <View
        style={{
          flex: 1,
          gap: space.sm,
          justifyContent: "flex-end",
          minHeight: bannerMinHeight,
          paddingHorizontal: space.lg,
          paddingBottom: space.lg,
          paddingTop: space["2xl"],
        }}
      >
        <Text
          role="caption"
          style={styles.eyebrow}
          tone="accent"
        >
          {kindLabel}
        </Text>
        <Text
          role="display"
          style={styles.heroTitle}
        >
          {title}
        </Text>
        <Text role="body" tone="muted">
          {subtitle}
        </Text>
        {hasProgress ? (
          <View style={{ marginTop: space.xs, maxWidth: 220 }}>
            <ProgressBar progress={progress} height={4} />
          </View>
        ) : null}
        <View
          style={[
            styles.cta,
            {
              marginTop: space.xs,
              paddingHorizontal: space.md,
              paddingVertical: space.xs,
            },
          ]}
        >
          <Text role="caption" style={styles.ctaLabel}>
            {ctaLabel}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    ...elevation.mid,
  },
  cinema: {
    borderRadius: 0,
  },
  card: {
    borderRadius: radii.xl,
  },
  placeholder: {
    backgroundColor: colors.surfaceRaised,
  },
  overlayStep: {
    ...StyleSheet.absoluteFill,
    left: 0,
    right: 0,
  },
  overlayTop: {
    backgroundColor: colors.bg,
    height: "28%",
    opacity: 0.35,
    top: 0,
  },
  overlayMid: {
    backgroundColor: colors.overlay,
    height: "40%",
    opacity: 0.55,
    top: "35%",
  },
  overlayLow: {
    backgroundColor: colors.bg,
    height: "45%",
    opacity: 0.75,
    top: "55%",
  },
  overlayBottom: {
    backgroundColor: colors.bg,
    height: "28%",
    opacity: 0.92,
    top: "72%",
  },
  accentWash: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.accentGlow,
    opacity: 0.22,
    top: "70%",
  },
  eyebrow: {
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  heroTitle: {
    letterSpacing: -0.4,
    textShadowColor: colors.bg,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 14,
  },
  cta: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.accentMuted,
    borderColor: colors.accent,
    borderRadius: radii.full,
    borderWidth: 1,
    justifyContent: "center",
  },
  ctaLabel: {
    color: colors.accent,
  },
});
