import { StyleSheet, View } from "react-native";

import { SkeletonBlock } from "@/components/SkeletonBlock";
import { t } from "@/i18n";
import { useUiSize } from "@/lib/UiSizeProvider";

type PosterGridSkeletonProps = {
  readonly cardWidth?: number;
  readonly rows?: number;
};

const DEFAULT_CARD_WIDTH = 108;
const CARD_ASPECT = 2 / 3;
const TITLE_HEIGHT = 28;

export const PosterGridSkeleton = ({
  cardWidth = DEFAULT_CARD_WIDTH,
  rows = 3,
}: PosterGridSkeletonProps) => {
  const { space, scale } = useUiSize();
  const posterHeight = cardWidth / CARD_ASPECT;
  const titleHeight = Math.round(TITLE_HEIGHT * scale);
  const items = Array.from({ length: rows * 3 }, (_, index) => index);

  return (
    <View
      accessibilityLabel={t("a11y.loadingLibrary")}
      accessibilityRole="progressbar"
      style={[styles.grid, { gap: space.sm }]}
    >
      {items.map((index) => (
        <View key={index} style={[styles.cell, { gap: space.sm }]}>
          <SkeletonBlock height={posterHeight} width={cardWidth} />
          <SkeletonBlock
            height={titleHeight}
            style={{ marginTop: space.xs }}
            width={cardWidth}
          />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  cell: {
    alignItems: "center",
    width: "31%",
  },
});
