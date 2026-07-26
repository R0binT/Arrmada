import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { type Availability } from "@/arr-client";
import { ProgressBar } from "@/components/ProgressBar";
import { availabilityLabel } from "@/i18n";
import { colors, fonts, radii } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";

type PosterCardProps = {
  readonly title: string;
  readonly posterUrl: string | undefined;
  readonly onPress: () => void;
  readonly onLongPress?: () => void;
  readonly selected?: boolean;
  readonly progress?: number;
  readonly availability?: Availability;
  /** Small label in the poster bottom-right (e.g. upcoming air date). */
  readonly cornerBadge?: string;
  readonly width?: number;
  readonly aspectRatio?: number;
};

const CORNER_COLOR: Record<Availability, string> = {
  dispo: colors.success,
  aTelecharger: colors.accent,
  aVenir: "rgba(154, 149, 140, 0.85)",
};

export const PosterCard = ({
  title,
  posterUrl,
  onPress,
  onLongPress,
  selected = false,
  progress,
  availability,
  cornerBadge,
  width = 112,
  aspectRatio = 2 / 3,
}: PosterCardProps) => {
  const { space, fontSize, minTouchTarget, scale } = useUiSize();
  const height = width / aspectRatio;
  const hasProgress = progress !== undefined && progress > 0;
  const statusHint = availability ? `, ${availabilityLabel(availability)}` : "";
  const badge = cornerBadge?.trim() ?? "";
  const hasBadge = badge.length > 0;
  const badgeHint = hasBadge ? `, ${badge}` : "";
  const cornerSize = Math.round(22 * scale);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}${statusHint}${badgeHint}${hasProgress ? `, ${Math.round(progress * 100)} percent downloaded` : ""}`}
      accessibilityState={{ selected }}
      delayLongPress={350}
      onLongPress={onLongPress}
      onPress={onPress}
      style={({ pressed }) => [
        { minHeight: minTouchTarget, width },
        pressed ? styles.pressed : null,
      ]}
    >
      <View
        style={[
          styles.posterWrap,
          { width, height },
          selected ? styles.selected : null,
        ]}
      >
        {posterUrl ? (
          <Image
            accessibilityIgnoresInvertColors
            contentFit="cover"
            source={{ uri: posterUrl }}
            style={styles.poster}
            transition={200}
          />
        ) : (
          <View style={styles.placeholder}>
            <Text style={[styles.placeholderText, { fontSize: fontSize(28) }]}>
              {title.slice(0, 1).toUpperCase()}
            </Text>
          </View>
        )}
        {availability ? (
          <View
            accessibilityElementsHidden
            importantForAccessibility="no"
            style={[
              styles.statusCorner,
              {
                borderRightWidth: cornerSize,
                borderTopColor: CORNER_COLOR[availability],
                borderTopWidth: cornerSize,
              },
            ]}
          />
        ) : null}
        {hasBadge ? (
          <View
            accessibilityElementsHidden
            importantForAccessibility="no"
            style={[
              styles.cornerBadge,
              {
                bottom: space.xs,
                maxWidth: "92%",
                paddingHorizontal: Math.max(5, space.xs + 1),
                paddingVertical: 2,
                right: space.xs,
              },
            ]}
          >
            <Text
              style={[
                styles.cornerBadgeText,
                {
                  fontSize: fontSize(10),
                  lineHeight: fontSize(12),
                },
              ]}
            >
              {badge}
            </Text>
          </View>
        ) : null}
        {hasProgress ? (
          <View
            style={[
              styles.progressOverlay,
              {
                gap: space.xs,
                paddingBottom: space.xs,
                paddingHorizontal: space.xs,
                paddingTop: space.sm,
              },
            ]}
          >
            <Text style={[styles.progressLabel, { fontSize: fontSize(11) }]}>
              {Math.round(progress * 100)}%
            </Text>
            <ProgressBar progress={progress} height={3} />
          </View>
        ) : null}
      </View>
      <Text
        numberOfLines={2}
        style={[styles.title, { fontSize: fontSize(13), marginTop: space.sm }]}
      >
        {title}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.85,
  },
  posterWrap: {
    borderRadius: radii.md,
    overflow: "hidden",
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selected: {
    borderColor: colors.accent,
  },
  poster: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  placeholderText: {
    color: colors.secondary,
    fontFamily: fonts.display,
  },
  statusCorner: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 0,
    height: 0,
    borderRightColor: "transparent",
  },
  cornerBadge: {
    position: "absolute",
    borderRadius: 4,
    backgroundColor: "rgba(11, 11, 15, 0.78)",
  },
  cornerBadgeText: {
    color: colors.text,
    fontFamily: fonts.uiMedium,
  },
  progressOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(11, 11, 15, 0.72)",
  },
  progressLabel: {
    color: colors.text,
    fontFamily: fonts.uiMedium,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.ui,
  },
});
