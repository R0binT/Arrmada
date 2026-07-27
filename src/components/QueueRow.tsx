import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

import type { QueueItem } from "@/arr-client";
import { formatBytes, formatEta } from "@/components/format";
import { IconButton } from "@/components/IconButton";
import { ProgressBar } from "@/components/ProgressBar";
import { StatusChip } from "@/components/StatusChip";
import { t } from "@/i18n";
import { colors, radii } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";
import { Surface, Text } from "@/ui";

type QueueRowProps = {
  readonly item: QueueItem;
  readonly onPause?: () => void;
  readonly onRemove: () => void;
};

export const QueueRow = ({ item, onPause, onRemove }: QueueRowProps) => {
  const { space, scale } = useUiSize();
  const downloaded = item.size - item.sizeLeft;
  const percent = Math.round(item.progress * 100);
  const isPaused = item.status === "paused";
  const showPause = item.canPause && onPause !== undefined;
  const posterWidth = Math.round(36 * scale);
  const posterHeight = Math.round(54 * scale);
  const actionSize = Math.round(36 * scale);

  return (
    <Surface
      radius="md"
      style={[
        styles.card,
        {
          gap: space.sm,
          paddingHorizontal: space.md,
          paddingVertical: space.sm,
        },
      ]}
      tone="raised"
    >
      <View accessibilityLabel={t("queue.itemA11y", { title: item.title })}>
        <View style={[styles.topRow, { gap: space.sm }]}>
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
                transition={200}
              />
            ) : (
              <View style={styles.posterPlaceholder}>
                <Text role="headline" tone="faint">
                  {item.title.slice(0, 1)}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.meta}>
            <Text numberOfLines={1} role="label">
              {item.title}
            </Text>
            <StatusChip status={item.status} />
          </View>
          <View style={[styles.actions, { gap: space.xs }]}>
            {showPause ? (
              <IconButton
                accessibilityLabel={
                  isPaused
                    ? t("queue.resumeNamedA11y", { title: item.title })
                    : t("queue.pauseNamedA11y", { title: item.title })
                }
                icon={isPaused ? "▶" : "❚❚"}
                onPress={onPause}
                style={{ minHeight: actionSize, minWidth: actionSize }}
                variant="outline"
              />
            ) : null}
            <IconButton
              accessibilityLabel={t("queue.cancelNamedA11y", {
                title: item.title,
              })}
              icon="✕"
              onPress={onRemove}
              style={{ minHeight: actionSize, minWidth: actionSize }}
            />
          </View>
        </View>

        <View style={[styles.progressSection, { gap: space["2xs"] }]}>
          <View style={[styles.progressRow, { gap: space.sm }]}>
            <View style={styles.progressBarWrap}>
              <ProgressBar progress={item.progress} height={3} />
            </View>
            <Text
              role="caption"
              style={{ minWidth: Math.round(36 * scale), textAlign: "right" }}
            >
              {percent}%
            </Text>
          </View>
          <Text numberOfLines={1} role="caption" tone="muted">
            {`Restant ${formatEta(item.etaSeconds)} · ${formatBytes(downloaded)} / ${formatBytes(item.size)}`}
          </Text>
        </View>
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  card: {},
  topRow: {
    alignItems: "center",
    flexDirection: "row",
  },
  posterWrap: {
    borderRadius: radii.sm,
    overflow: "hidden",
  },
  poster: {
    height: "100%",
    width: "100%",
  },
  posterPlaceholder: {
    alignItems: "center",
    backgroundColor: colors.bg,
    flex: 1,
    justifyContent: "center",
  },
  meta: {
    flex: 1,
    gap: 4,
    justifyContent: "center",
    minWidth: 0,
  },
  actions: {
    flexDirection: "row",
  },
  progressSection: {},
  progressRow: {
    alignItems: "center",
    flexDirection: "row",
  },
  progressBarWrap: {
    flex: 1,
  },
});
