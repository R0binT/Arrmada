import { StyleSheet, View } from "react-native";

import { SkeletonBlock } from "@/components/SkeletonBlock";
import { t } from "@/i18n";
import { radii, space } from "@/lib/theme";

type QueueSkeletonProps = {
  readonly rows?: number;
};

export const QueueSkeleton = ({ rows = 3 }: QueueSkeletonProps) => {
  const items = Array.from({ length: rows }, (_, index) => index);

  return (
    <View
      accessibilityLabel={t("a11y.loadingQueue")}
      accessibilityRole="progressbar"
      style={styles.list}
    >
      {items.map((index) => (
        <View key={index} style={styles.card}>
          <View style={styles.topRow}>
            <SkeletonBlock borderRadius={radii.md} height={88} width={60} />
            <View style={styles.meta}>
              <SkeletonBlock height={18} width="80%" />
              <SkeletonBlock height={24} width={72} />
            </View>
          </View>
          <View style={styles.actions}>
            <SkeletonBlock borderRadius={radii.md} height={44} width={44} />
            <SkeletonBlock borderRadius={radii.md} height={44} width={44} />
            <SkeletonBlock borderRadius={radii.md} height={44} width={44} />
          </View>
          <SkeletonBlock height={6} width="100%" />
          <SkeletonBlock height={14} width="55%" />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  list: {
    gap: space.md,
  },
  card: {
    gap: space.md,
  },
  topRow: {
    flexDirection: "row",
    gap: space.md,
  },
  meta: {
    flex: 1,
    gap: space.sm,
    justifyContent: "center",
  },
  actions: {
    flexDirection: "row",
    gap: space.sm,
  },
});
