import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useI18n } from "@/i18n";
import { colors, radii } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";
import { selectOfflineBanner } from "@/offline/offline-ui-selectors";
import { useOfflineStatus } from "@/offline/use-offline-status";
import { useOutboxPendingCount } from "@/offline/use-outbox-items";
import { Text } from "@/ui";

/**
 * Global, discreet status strip for device offline, Arr unreachable, or queued work.
 */
export const OfflineBanner = () => {
  const { t } = useI18n();
  const { space } = useUiSize();
  const insets = useSafeAreaInsets();
  const status = useOfflineStatus();
  const pendingCount = useOutboxPendingCount();
  const banner = selectOfflineBanner(status, pendingCount);
  if (!banner.visible) {
    return null;
  }
  const message = banner.lines
    .map((line) =>
      line.count === undefined ? t(line.key) : t(line.key, { count: line.count }),
    )
    .join(" · ");
  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={[
        styles.bar,
        {
          paddingBottom: space.xs,
          paddingHorizontal: space.md,
          paddingTop: Math.max(insets.top, space.xs),
        },
      ]}
    >
      <Text role="caption" tone="muted">
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.surfaceRaised,
    borderBottomColor: colors.borderSubtle,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomLeftRadius: radii.sm,
    borderBottomRightRadius: radii.sm,
  },
});
