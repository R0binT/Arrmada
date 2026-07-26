import type { QueueStatus } from "@/arr-client";
import { queueStatusLabel } from "@/features/media-quick/queue-status-label";
import { t } from "@/i18n";
import { colors, fonts, radii, space } from "@/lib/theme";
import { StyleSheet, Text, View } from "react-native";

type StatusChipProps = {
  readonly status: QueueStatus;
};

type StatusStyle = {
  readonly icon: string;
  readonly backgroundColor: string;
  readonly textColor: string;
};

const STATUS_STYLE: Record<QueueStatus, StatusStyle> = {
  downloading: {
    icon: "↓",
    backgroundColor: colors.accent,
    textColor: colors.bg,
  },
  queued: {
    icon: "◷",
    backgroundColor: colors.surface,
    textColor: colors.secondary,
  },
  paused: {
    icon: "❚❚",
    backgroundColor: colors.surface,
    textColor: colors.secondary,
  },
  completed: {
    icon: "✓",
    backgroundColor: colors.success,
    textColor: colors.bg,
  },
  failed: {
    icon: "!",
    backgroundColor: colors.danger,
    textColor: colors.text,
  },
  stalled: {
    icon: "⚠",
    backgroundColor: colors.danger,
    textColor: colors.text,
  },
  unknown: {
    icon: "?",
    backgroundColor: colors.surface,
    textColor: colors.secondary,
  },
};

export const StatusChip = ({ status }: StatusChipProps) => {
  const style = STATUS_STYLE[status];
  const label = queueStatusLabel(status);

  return (
    <View
      accessibilityLabel={t("queue.statusA11y", { label })}
      style={[styles.chip, { backgroundColor: style.backgroundColor }]}
    >
      <Text style={[styles.icon, { color: style.textColor }]}>
        {style.icon}
      </Text>
      <Text style={[styles.label, { color: style.textColor }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: radii.md,
    flexDirection: "row",
    gap: space.xs,
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
  },
  icon: {
    fontFamily: fonts.uiMedium,
    fontSize: 11,
  },
  label: {
    fontFamily: fonts.uiMedium,
    fontSize: 12,
  },
});
