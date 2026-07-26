import { StyleSheet, View } from "react-native";

import { SkeletonBlock } from "@/components/SkeletonBlock";
import { t } from "@/i18n";
import { space } from "@/lib/theme";

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
  const posterHeight = cardWidth / CARD_ASPECT;
  const items = Array.from({ length: rows * 3 }, (_, index) => index);

  return (
    <View
      accessibilityLabel={t("a11y.loadingLibrary")}
      accessibilityRole="progressbar"
      style={styles.grid}
    >
      {items.map((index) => (
        <View key={index} style={styles.cell}>
          <SkeletonBlock height={posterHeight} width={cardWidth} />
          <SkeletonBlock
            height={TITLE_HEIGHT}
            style={styles.title}
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
    gap: space.sm,
    justifyContent: "center",
  },
  cell: {
    alignItems: "center",
    gap: space.sm,
    width: "31%",
  },
  title: {
    marginTop: space.xs,
  },
});
