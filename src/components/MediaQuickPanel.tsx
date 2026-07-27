import { ScrollView, StyleSheet, View } from "react-native";

import { ProgressBar } from "@/components/ProgressBar";
import type {
  MediaQuickAddActions,
  MediaQuickStatusTone,
  MediaQuickViewModel,
  PrimaryDestination,
} from "@/features/media-quick/types";
import { t } from "@/i18n";
import { colors } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";
import { Button } from "@/ui/Button";
import { Chip } from "@/ui/Chip";
import { Text } from "@/ui/Text";
import type { ChipTone } from "@/ui/variant-styles";

type MediaQuickPanelProps = {
  readonly viewModel: MediaQuickViewModel;
  readonly onOpenPrimary: (destination: PrimaryDestination) => void;
  readonly addActions?: MediaQuickAddActions;
};

const STATUS_TONE: Record<MediaQuickStatusTone, ChipTone> = {
  success: "success",
  accent: "accent",
  muted: "neutral",
  danger: "danger",
};

export const MediaQuickPanel = ({
  viewModel,
  onOpenPrimary,
  addActions,
}: MediaQuickPanelProps) => {
  const { space } = useUiSize();
  const hasProgress =
    viewModel.progress !== undefined && viewModel.progress > 0;
  const hasStatus = viewModel.statusLine.length > 0;

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        gap: space.md,
        maxHeight: "100%",
        paddingBottom: space.sm,
        paddingHorizontal: space.lg,
        paddingTop: space.xs,
      }}
    >
      <ScrollView
        bounces={false}
        contentContainerStyle={{
          gap: space.md,
          paddingBottom: space.xs,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={[styles.titleRow, { gap: space.sm }]}>
            <Text role="title" style={styles.title}>
              {viewModel.title}
            </Text>
            {hasStatus ? (
              <Chip
                style={
                  viewModel.statusTone === "muted"
                    ? { backgroundColor: colors.neutralMuted }
                    : undefined
                }
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

        {viewModel.chips.length > 0 ? (
          <View style={[styles.chipWrap, { gap: space.xs }]}>
            {viewModel.chips.map((chip) => (
              <Chip
                key={chip}
                style={{ backgroundColor: colors.borderSubtle }}
                tone="neutral"
              >
                {chip}
              </Chip>
            ))}
          </View>
        ) : null}

        {viewModel.detailLine ? (
          <Text role="body" tone="muted">
            {viewModel.detailLine}
          </Text>
        ) : null}

        {hasProgress && viewModel.progress !== undefined ? (
          <View style={{ marginTop: -space.xs }}>
            <ProgressBar progress={viewModel.progress} height={4} />
          </View>
        ) : null}
      </ScrollView>

      {addActions ? (
        <View style={{ gap: space.sm }}>
          <Button
            accessibilityLabel={t("add.seeFiche")}
            onPress={addActions.onSeeFiche}
            style={styles.fullWidth}
            variant="secondary"
          >
            {t("add.seeFiche")}
          </Button>
          <Button
            accessibilityLabel={t("action.add")}
            disabled={!addActions.canAdd}
            onPress={addActions.onAdd}
            style={styles.fullWidth}
          >
            {t("action.add")}
          </Button>
        </View>
      ) : (
        <Button
          accessibilityLabel={t(viewModel.destination.ctaKey)}
          onPress={() => onOpenPrimary(viewModel.destination)}
          style={styles.fullWidth}
        >
          {t(viewModel.destination.ctaKey)}
        </Button>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    gap: 2,
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
  },
  title: {
    flex: 1,
    minWidth: 0,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  fullWidth: {
    alignSelf: "stretch",
  },
});
