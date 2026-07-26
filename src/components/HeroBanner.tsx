import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ProgressBar } from "@/components/ProgressBar";
import { useI18n } from "@/i18n";
import { colors, fonts, radii } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";

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
  const { space, fontSize, minTouchTarget, scale } = useUiSize();
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
      <View
        style={{
          flex: 1,
          gap: space.xs,
          justifyContent: "flex-end",
          minHeight: bannerMinHeight,
          padding: space.md,
        }}
      >
        <Text style={[styles.title, { fontSize: fontSize(22) }]}>{title}</Text>
        <Text style={[styles.subtitle, { fontSize: fontSize(13) }]}>
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
          <Text style={[styles.ctaText, { fontSize: fontSize(13) }]}>
            {ctaLabel}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.md,
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
  title: {
    color: colors.text,
    fontFamily: fonts.display,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  subtitle: {
    color: colors.text,
    fontFamily: fonts.ui,
    opacity: 0.9,
  },
  ctaText: {
    color: colors.accent,
    fontFamily: fonts.uiMedium,
  },
});
