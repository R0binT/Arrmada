import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ProgressBar } from "@/components/ProgressBar";
import type {
    MediaQuickStatusTone,
    MediaQuickViewModel,
    PrimaryDestination,
} from "@/features/media-quick/types";
import { t } from "@/i18n";
import { colors, fonts, radii } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";

type MediaQuickPanelProps = {
  readonly viewModel: MediaQuickViewModel;
  readonly onOpenPrimary: (destination: PrimaryDestination) => void;
};

const STATUS_PILL: Record<
  MediaQuickStatusTone,
  { readonly backgroundColor: string; readonly color: string }
> = {
  success: {
    backgroundColor: "rgba(111, 191, 122, 0.18)",
    color: colors.success,
  },
  accent: {
    backgroundColor: "rgba(245, 165, 36, 0.16)",
    color: colors.accent,
  },
  muted: {
    backgroundColor: "rgba(154, 149, 140, 0.18)",
    color: colors.secondary,
  },
  danger: {
    backgroundColor: "rgba(196, 92, 74, 0.18)",
    color: colors.danger,
  },
};

export const MediaQuickPanel = ({
  viewModel,
  onOpenPrimary,
}: MediaQuickPanelProps) => {
  const { space, fontSize, minTouchTarget } = useUiSize();
  const hasProgress =
    viewModel.progress !== undefined && viewModel.progress > 0;
  const hasStatus = viewModel.statusLine.length > 0;
  const statusColors = STATUS_PILL[viewModel.statusTone];

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
            <Text
              style={[
                styles.title,
                {
                  fontSize: fontSize(22),
                  lineHeight: fontSize(28),
                },
              ]}
            >
              {viewModel.title}
            </Text>
            {hasStatus ? (
              <View
                style={[
                  styles.statusPill,
                  { backgroundColor: statusColors.backgroundColor },
                ]}
              >
                <Text
                  style={[
                    styles.statusPillText,
                    {
                      color: statusColors.color,
                      fontSize: fontSize(12),
                    },
                  ]}
                >
                  {viewModel.statusLine}
                </Text>
              </View>
            ) : null}
          </View>
          {viewModel.subtitle ? (
            <Text style={[styles.subtitle, { fontSize: fontSize(14) }]}>
              {viewModel.subtitle}
            </Text>
          ) : null}
        </View>

        {viewModel.chips.length > 0 ? (
          <View style={[styles.chipWrap, { gap: space.xs }]}>
            {viewModel.chips.map((chip) => (
              <View key={chip} style={styles.chip}>
                <Text style={[styles.chipText, { fontSize: fontSize(12) }]}>
                  {chip}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {viewModel.detailLine ? (
          <Text
            style={[
              styles.detail,
              {
                fontSize: fontSize(13),
                lineHeight: fontSize(18),
              },
            ]}
          >
            {viewModel.detailLine}
          </Text>
        ) : null}

        {hasProgress && viewModel.progress !== undefined ? (
          <View style={{ marginTop: -space.xs }}>
            <ProgressBar progress={viewModel.progress} height={4} />
          </View>
        ) : null}
      </ScrollView>

      <Pressable
        accessibilityLabel={t(viewModel.destination.ctaKey)}
        accessibilityRole="button"
        onPress={() => onOpenPrimary(viewModel.destination)}
        style={({ pressed }) => [
          styles.cta,
          { minHeight: minTouchTarget },
          pressed ? styles.ctaPressed : null,
        ]}
      >
        <Text style={[styles.ctaText, { fontSize: fontSize(16) }]}>
          {t(viewModel.destination.ctaKey)}
        </Text>
      </Pressable>
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
    color: colors.text,
    flex: 1,
    fontFamily: fonts.display,
    minWidth: 0,
  },
  subtitle: {
    color: colors.secondary,
    fontFamily: fonts.uiMedium,
  },
  statusPill: {
    borderRadius: 8,
    flexShrink: 0,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusPillText: {
    fontFamily: fonts.uiMedium,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  chip: {
    backgroundColor: "rgba(244, 240, 232, 0.08)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipText: {
    color: colors.text,
    fontFamily: fonts.uiMedium,
  },
  detail: {
    color: colors.secondary,
    fontFamily: fonts.ui,
  },
  cta: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    justifyContent: "center",
  },
  ctaPressed: {
    opacity: 0.85,
  },
  ctaText: {
    color: colors.bg,
    fontFamily: fonts.uiBold,
  },
});
