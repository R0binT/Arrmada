import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { UpcomingItem } from "@/arr-client";
import { formatUpcomingDate } from "@/arr-client";
import { localeToBcp47, useI18n } from "@/i18n";
import { colors, fonts, radii } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";

type UpcomingRowProps = {
  readonly item: UpcomingItem;
  readonly onPress: () => void;
};

export const UpcomingRow = ({ item, onPress }: UpcomingRowProps) => {
  const { t, locale } = useI18n();
  const { space, fontSize, minTouchTarget, scale } = useUiSize();
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
        styles.row,
        {
          gap: space.md,
          minHeight: minTouchTarget,
          padding: space.sm,
        },
        pressed ? styles.pressed : null,
      ]}
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
      <View style={styles.body}>
        <Text
          numberOfLines={1}
          style={[styles.title, { fontSize: fontSize(16) }]}
        >
          {item.title}
        </Text>
        {item.subtitle ? (
          <Text
            numberOfLines={1}
            style={[styles.subtitle, { fontSize: fontSize(14) }]}
          >
            {item.subtitle}
          </Text>
        ) : null}
        <Text style={[styles.meta, { fontSize: fontSize(13) }]}>
          {kindLabel} · {dateLabel}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    flexDirection: "row",
  },
  pressed: {
    opacity: 0.85,
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
    backgroundColor: "rgba(244, 240, 232, 0.08)",
    flex: 1,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.uiBold,
  },
  subtitle: {
    color: colors.secondary,
    fontFamily: fonts.ui,
  },
  meta: {
    color: colors.accent,
    fontFamily: fonts.uiMedium,
    marginTop: 2,
  },
});
