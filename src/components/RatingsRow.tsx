import { View } from "react-native";

import type { RatingScore } from "@/arr-client";
import { formatRatingLabel } from "@/arr-client/mappers/ratings";
import { useUiSize } from "@/lib/UiSizeProvider";
import { Text } from "@/ui/Text";

type RatingsRowProps = {
  readonly ratings: readonly RatingScore[];
};

export const RatingsRow = ({ ratings }: RatingsRowProps) => {
  const { space } = useUiSize();
  if (ratings.length === 0) return null;
  const label = ratings.map(formatRatingLabel).join(" · ");
  return (
    <View style={{ marginBottom: space.sm }}>
      <Text role="label">{label}</Text>
    </View>
  );
};
