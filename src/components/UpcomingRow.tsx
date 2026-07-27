import { Image } from "expo-image";
import { Pressable, StyleSheet, View } from "react-native";

import type { UpcomingItem } from "@/arr-client";
import { formatUpcomingDate } from "@/arr-client";
import { localeToBcp47, useI18n } from "@/i18n";
import { colors, radii } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";
import { pressScaleStyle, Surface, Text, useReduceMotion } from "@/ui";

type UpcomingRowProps = {
  readonly item: UpcomingItem;
  readonly onPress: () => void;
};

export const UpcomingRow = ({ item, onPress }: UpcomingRowProps) => {
  const { t, locale } = useI18n();
  const { space, minTouchTarget, scale } = useUiSize();
  const reduceMotion = useReduceMotion();
  const kindLabel =
    item.kind === "movie" ? t("upcoming.kindMovie") : t("upcoming.kindEpisode");
  const dateLabel = formatUpcomingDate(item.date, localeToBcp47(locale));
  const accessibilityLabel = `${item.title}, ${kindLabel}, ${dateLabel}`;
  const posterWidth = Math.round(48 * scale);
  const posterHeight = Math.round(72 * scale);

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        pressScaleStyle(pressed, reduceMotion),
        styles.rowPressable,
      ]}
    >
      <Surface
        radius="md"
        style={[
          styles.row,
          {
            gap: space.md,
            minHeight: minTouchTarget,
            padding: space.sm,
          },
        ]}
        tone="raised"
      >
        <View
          style={[
            styles.posterWrap,
            { height: posterHeight, width: posterWidth },
          ]}
        >
          {item.posterUrl ? (
            <Image
              accessibilityIgnoresInvertColors
              contentFit="cover"
              source={{ uri: item.posterUrl }}
              style={styles.poster}
            />
          ) : (
            <View style={styles.posterFallback} />
          )}
        </View>
        <View style={[styles.body, { gap: space["2xs"] }]}>
          <Text numberOfLines={1} role="headline">
            {item.title}
          </Text>
          {item.subtitle ? (
            <Text numberOfLines={1} role="body" tone="muted">
              {item.subtitle}
            </Text>
          ) : null}
          <Text role="caption" tone="accent">
            {kindLabel} · {dateLabel}
          </Text>
        </View>
      </Surface>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  rowPressable: {
    alignSelf: "stretch",
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
  },
  posterWrap: {
    borderRadius: radii.md,
    overflow: "hidden",
  },
  poster: {
    height: "100%",
    width: "100%",
  },
  posterFallback: {
    backgroundColor: colors.borderSubtle,
    flex: 1,
  },
  body: {
    flex: 1,
  },
});
