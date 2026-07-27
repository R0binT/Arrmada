import { Image } from "expo-image";
import { Pressable, StyleSheet, View } from "react-native";

import { type Availability } from "@/arr-client";
import { ProgressBar } from "@/components/ProgressBar";
import { availabilityLabel } from "@/i18n";
import { colors, radii } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";
import { pressScaleStyle, Text, useReduceMotion } from "@/ui";

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
  aTelecharger: colors.info,
  aVenir: colors.warning,
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
  const { space, minTouchTarget, scale } = useUiSize();
  const reduceMotion = useReduceMotion();
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
        pressScaleStyle(pressed, reduceMotion),
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
            <Text role="display" tone="muted">
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
            <Text role="caption" numberOfLines={1}>
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
            <Text role="caption">{Math.round(progress * 100)}%</Text>
            <ProgressBar progress={progress} height={3} />
          </View>
        ) : null}
      </View>
      <Text numberOfLines={2} role="label" style={{ marginTop: space.sm }}>
        {title}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  posterWrap: {
    backgroundColor: colors.surface,
    borderColor: colors.borderSubtle,
    borderRadius: radii.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  selected: {
    borderColor: colors.accentGlow,
    borderWidth: 2,
  },
  poster: {
    height: "100%",
    width: "100%",
  },
  placeholder: {
    alignItems: "center",
    backgroundColor: colors.surface,
    flex: 1,
    justifyContent: "center",
  },
  statusCorner: {
    borderRightColor: "transparent",
    height: 0,
    left: 0,
    position: "absolute",
    top: 0,
    width: 0,
  },
  cornerBadge: {
    backgroundColor: colors.overlay,
    borderRadius: radii.sm,
    position: "absolute",
  },
  progressOverlay: {
    backgroundColor: colors.overlay,
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
  },
});
