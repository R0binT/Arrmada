import { StyleSheet, View } from "react-native";

import type { RatingScore } from "@/arr-client";
import { formatRatingLabel } from "@/arr-client/mappers/ratings";
import { useUiSize } from "@/lib/UiSizeProvider";
import { Chip } from "@/ui/Chip";

type RatingsRowProps = {
  readonly ratings: readonly RatingScore[];
};

const MAX_RATING_BADGES = 4;

export const RatingsRow = ({ ratings }: RatingsRowProps) => {
  const { space } = useUiSize();
  if (ratings.length === 0) return null;
  return (
    <View style={[styles.wrap, { gap: space.xs, marginBottom: space.sm }]}>
      {ratings.slice(0, MAX_RATING_BADGES).map((score) => (
        <Chip key={`${score.source}-${score.value}`} tone="warning">
          {formatRatingLabel(score)}
        </Chip>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
});
