import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

import { ProgressBar } from "@/components/ProgressBar";
import type {
  MediaQuickAddActions,
  MediaQuickStatusTone,
  MediaQuickViewModel,
  PrimaryDestination,
} from "@/features/media-quick/types";
import { t } from "@/i18n";
import { colors, elevation, radii } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";
import { Button } from "@/ui/Button";
import { Chip } from "@/ui/Chip";
import { Text } from "@/ui/Text";
import type { ChipTone } from "@/ui/variant-styles";

type MediaQuickPanelProps = {
  readonly viewModel: MediaQuickViewModel;
  readonly onOpenPrimary: (destination: PrimaryDestination) => void;
  readonly addActions?: MediaQuickAddActions;
  /** When true, CTA buttons are omitted (rendered outside the dismiss pan). */
  readonly omitActions?: boolean;
};

type MediaQuickActionsProps = {
  readonly viewModel: MediaQuickViewModel;
  readonly onOpenPrimary: (destination: PrimaryDestination) => void;
  readonly addActions?: MediaQuickAddActions;
};

const STATUS_TONE: Record<MediaQuickStatusTone, ChipTone> = {
  success: "success",
  accent: "accent",
  warning: "warning",
  info: "info",
  muted: "neutral",
  danger: "danger",
};

export const MediaQuickActions = ({
  viewModel,
  onOpenPrimary,
  addActions,
}: MediaQuickActionsProps) => {
  const { space } = useUiSize();

  if (addActions) {
    return (
      <View style={{ gap: space.xs }}>
        <Button
          accessibilityLabel={t("add.seeFiche")}
          onPress={addActions.onSeeFiche}
          size="compact"
          style={styles.fullWidth}
          variant="secondary"
        >
          {t("add.seeFiche")}
        </Button>
        <Button
          accessibilityLabel={t("action.add")}
          disabled={!addActions.canAdd}
          onPress={addActions.onAdd}
          size="compact"
          style={styles.fullWidth}
        >
          {t("action.add")}
        </Button>
      </View>
    );
  }

  return (
    <Button
      accessibilityLabel={t(viewModel.destination.ctaKey)}
      onPress={() => onOpenPrimary(viewModel.destination)}
      size="compact"
      style={styles.fullWidth}
    >
      {t(viewModel.destination.ctaKey)}
    </Button>
  );
};

export const MediaQuickPanel = ({
  viewModel,
  onOpenPrimary,
  addActions,
  omitActions = false,
}: MediaQuickPanelProps) => {
  const { space, scale } = useUiSize();
  const hasProgress =
    viewModel.progress !== undefined && viewModel.progress > 0;
  const hasStatus = viewModel.statusLine.length > 0;
  const posterSize = Math.round(72 * scale);

  return (
    <View
      style={{
        backgroundColor: colors.surfaceRaised,
        gap: space.md,
        maxHeight: "100%",
        paddingBottom: omitActions ? 0 : space.sm,
        paddingHorizontal: space.lg,
        paddingTop: space.xs,
      }}
    >
      <View
        style={{
          gap: space.lg,
          paddingBottom: space.xs,
        }}
      >
        <View style={[styles.header, { gap: space.md }]}>
          <View style={[styles.titleBlock, { gap: space.sm }]}>
            {viewModel.posterUrl ? (
              <View
                pointerEvents="none"
                style={[
                  styles.posterFrame,
                  elevation.low,
                  { height: posterSize * 1.5, width: posterSize },
                ]}
              >
                <Image
                  accessibilityIgnoresInvertColors
                  contentFit="cover"
                  pointerEvents="none"
                  source={{ uri: viewModel.posterUrl }}
                  style={StyleSheet.absoluteFill}
                  transition={180}
                />
              </View>
            ) : null}
            <View style={[styles.headerCopy, { gap: space.xs }]}>
              <View style={[styles.titleRow, { gap: space.sm }]}>
                <Text role="title" style={styles.title}>
                  {viewModel.title}
                </Text>
                {hasStatus ? (
                  <Chip
                    style={styles.statusChip}
                    tone={STATUS_TONE[viewModel.statusTone]}
                  >
                    {viewModel.statusLine}
                  </Chip>
                ) : null}
              </View>
              {viewModel.subtitle ? (
                <Text role="body" tone="muted">
                  {viewModel.subtitle}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        {viewModel.chipRows.length > 0 ? (
          <View style={{ gap: space.sm, marginTop: space.xs }}>
            {viewModel.chipRows.map((row) => (
              <View
                key={row.map((chip) => chip.label).join("|")}
                style={[styles.chipWrap, { gap: space.xs }]}
              >
                {row.map((chip) => (
                  <Chip key={chip.label} tone={chip.tone}>
                    {chip.label}
                  </Chip>
                ))}
              </View>
            ))}
          </View>
        ) : null}

        {viewModel.detailLines.length > 0 ? (
          <View style={{ gap: space.xs }}>
            {viewModel.detailLines.map((line) => (
              <Text key={line} role="body" tone="muted">
                {line}
              </Text>
            ))}
          </View>
        ) : null}

        {hasProgress && viewModel.progress !== undefined ? (
          <View style={{ marginTop: -space.xs }}>
            <ProgressBar progress={viewModel.progress} height={4} />
          </View>
        ) : null}
      </View>

      {omitActions ? null : (
        <MediaQuickActions
          addActions={addActions}
          onOpenPrimary={onOpenPrimary}
          viewModel={viewModel}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {},
  titleBlock: {
    alignItems: "flex-start",
    flexDirection: "row",
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  title: {
    flex: 1,
    minWidth: 0,
  },
  statusChip: {
    alignSelf: "center",
    flexShrink: 0,
  },
  posterFrame: {
    backgroundColor: colors.surface,
    borderColor: colors.borderSubtle,
    borderRadius: radii.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  fullWidth: {
    alignSelf: "stretch",
  },
});
