import { StyleSheet, View } from "react-native";

import { SkeletonBlock } from "@/components/SkeletonBlock";
import { t } from "@/i18n";
import { radii } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";

type QueueSkeletonProps = {
  readonly rows?: number;
};

export const QueueSkeleton = ({ rows = 3 }: QueueSkeletonProps) => {
  const { space, scale, minTouchTarget } = useUiSize();
  const items = Array.from({ length: rows }, (_, index) => index);
  const posterW = Math.round(60 * scale);
  const posterH = Math.round(88 * scale);
  const action = minTouchTarget;

  return (
    <View
      accessibilityLabel={t("a11y.loadingQueue")}
      accessibilityRole="progressbar"
      style={{ gap: space.md }}
    >
      {items.map((index) => (
        <View key={index} style={{ gap: space.md }}>
          <View style={[styles.topRow, { gap: space.md }]}>
            <SkeletonBlock
              borderRadius={radii.md}
              height={posterH}
              width={posterW}
            />
            <View style={[styles.meta, { gap: space.sm }]}>
              <SkeletonBlock height={Math.round(18 * scale)} width="80%" />
              <SkeletonBlock
                height={Math.round(24 * scale)}
                width={Math.round(72 * scale)}
              />
            </View>
          </View>
          <View style={[styles.actions, { gap: space.sm }]}>
            <SkeletonBlock
              borderRadius={radii.md}
              height={action}
              width={action}
            />
            <SkeletonBlock
              borderRadius={radii.md}
              height={action}
              width={action}
            />
            <SkeletonBlock
              borderRadius={radii.md}
              height={action}
              width={action}
            />
          </View>
          <SkeletonBlock height={6} width="100%" />
          <SkeletonBlock height={Math.round(14 * scale)} width="55%" />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  topRow: {
    flexDirection: "row",
  },
  meta: {
    flex: 1,
    justifyContent: "center",
  },
  actions: {
    flexDirection: "row",
  },
});
