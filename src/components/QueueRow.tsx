import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";

import type { QueueItem } from "@/arr-client";
import { formatBytes, formatEta } from "@/components/format";
import { IconButton } from "@/components/IconButton";
import { ProgressBar } from "@/components/ProgressBar";
import { StatusChip } from "@/components/StatusChip";
import { t } from "@/i18n";
import { colors, fonts, radii, space } from "@/lib/theme";

type QueueRowProps = {
  readonly item: QueueItem;
  readonly onPause?: () => void;
  readonly onRemove: () => void;
};

export const QueueRow = ({ item, onPause, onRemove }: QueueRowProps) => {
  const downloaded = item.size - item.sizeLeft;
  const percent = Math.round(item.progress * 100);
  const isPaused = item.status === "paused";
  const showPause = item.canPause && onPause !== undefined;

  return (
    <View
      accessibilityLabel={t("queue.itemA11y", { title: item.title })}
      style={styles.card}
    >
      <View style={styles.topRow}>
        <View style={styles.posterWrap}>
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
              <Text style={styles.posterInitial}>{item.title.slice(0, 1)}</Text>
            </View>
          )}
        </View>
        <View style={styles.meta}>
          <Text numberOfLines={1} style={styles.title}>
            {item.title}
          </Text>
          <StatusChip status={item.status} />
        </View>
        <View style={styles.actions}>
          {showPause ? (
            <IconButton
              accessibilityLabel={
                isPaused
                  ? t("queue.resumeNamedA11y", { title: item.title })
                  : t("queue.pauseNamedA11y", { title: item.title })
              }
              icon={isPaused ? "▶" : "❚❚"}
              onPress={onPause}
              style={styles.actionButton}
              variant="outline"
            />
          ) : null}
          <IconButton
            accessibilityLabel={t("queue.cancelNamedA11y", {
              title: item.title,
            })}
            icon="✕"
            onPress={onRemove}
            style={styles.actionButton}
          />
        </View>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressRow}>
          <View style={styles.progressBarWrap}>
            <ProgressBar progress={item.progress} height={3} />
          </View>
          <Text style={styles.percent}>{percent}%</Text>
        </View>
        <Text numberOfLines={1} style={styles.detail}>
          {`Restant ${formatEta(item.etaSeconds)} · ${formatBytes(downloaded)} / ${formatBytes(item.size)}`}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  topRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: space.sm,
  },
  posterWrap: {
    borderRadius: 8,
    height: 54,
    overflow: "hidden",
    width: 36,
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
  posterInitial: {
    color: colors.secondary,
    fontFamily: fonts.display,
    fontSize: 14,
  },
  meta: {
    flex: 1,
    gap: 4,
    justifyContent: "center",
    minWidth: 0,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.uiMedium,
    fontSize: 14,
  },
  actions: {
    flexDirection: "row",
    gap: space.xs,
  },
  actionButton: {
    minHeight: 36,
    minWidth: 36,
  },
  progressSection: {
    gap: 4,
  },
  progressRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: space.sm,
  },
  progressBarWrap: {
    flex: 1,
  },
  percent: {
    color: colors.text,
    fontFamily: fonts.uiMedium,
    fontSize: 12,
    minWidth: 36,
    textAlign: "right",
  },
  detail: {
    color: colors.secondary,
    fontFamily: fonts.ui,
    fontSize: 12,
  },
});
