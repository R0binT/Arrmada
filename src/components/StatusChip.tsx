import type { QueueStatus } from "@/arr-client";
import { queueStatusLabel } from "@/features/media-quick/queue-status-label";
import { t } from "@/i18n";
import { colors, fonts, radii } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";
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
  const { space, fontSize } = useUiSize();
  const style = STATUS_STYLE[status];
  const label = queueStatusLabel(status);

  return (
    <View
      accessibilityLabel={t("queue.statusA11y", { label })}
      style={[
        styles.chip,
        {
          backgroundColor: style.backgroundColor,
          gap: space.xs,
          paddingHorizontal: space.sm,
          paddingVertical: space.xs,
        },
      ]}
    >
      <Text
        style={[
          styles.icon,
          { color: style.textColor, fontSize: fontSize(11) },
        ]}
      >
        {style.icon}
      </Text>
      <Text
        style={[
          styles.label,
          { color: style.textColor, fontSize: fontSize(12) },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: radii.md,
    flexDirection: "row",
  },
  icon: {
    fontFamily: fonts.uiMedium,
  },
  label: {
    fontFamily: fonts.uiMedium,
  },
});
