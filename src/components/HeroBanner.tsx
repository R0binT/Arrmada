import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ProgressBar } from "@/components/ProgressBar";
import { useI18n } from "@/i18n";
import { colors, fonts, minTouchTarget, radii, space } from "@/lib/theme";

export type HeroBannerKind = "download" | "movie" | "series";

type HeroBannerProps = {
  readonly title: string;
  readonly subtitle: string;
  readonly posterUrl: string | undefined;
  readonly progress?: number;
  readonly kind: HeroBannerKind;
  readonly onPress: () => void;
};

export const HeroBanner = ({
  title,
  subtitle,
  posterUrl,
  progress,
  kind,
  onPress,
}: HeroBannerProps) => {
  const { t } = useI18n();
  const hasProgress = progress !== undefined && progress > 0;
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
        pressed ? styles.pressed : null,
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
      <View style={styles.overlay} />
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        {hasProgress ? (
          <View style={styles.progressBlock}>
            <ProgressBar progress={progress} height={3} />
          </View>
        ) : null}
        <View style={styles.ctaRow}>
          <Text style={styles.ctaText}>{ctaLabel}</Text>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.md,
    minHeight: 140,
    overflow: "hidden",
  },
  pressed: {
    opacity: 0.92,
  },
  placeholder: {
    backgroundColor: colors.surface,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(11, 11, 15, 0.55)",
  },
  content: {
    flex: 1,
    justifyContent: "flex-end",
    minHeight: 140,
    padding: space.md,
    gap: space.xs,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 22,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  subtitle: {
    color: colors.text,
    fontFamily: fonts.ui,
    fontSize: 13,
    opacity: 0.9,
  },
  progressBlock: {
    marginTop: space.xs,
    maxWidth: 180,
  },
  ctaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: space.sm,
    marginTop: space.xs,
    minHeight: minTouchTarget,
  },
  ctaText: {
    color: colors.accent,
    fontFamily: fonts.uiMedium,
    fontSize: 13,
  },
});
