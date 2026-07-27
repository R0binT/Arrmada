import { StyleSheet, Text, View } from "react-native";

import type { LookupLibraryBadge } from "@/features/library/lookup-library-status";
import { useI18n } from "@/i18n";
import { colors, fonts } from "@/lib/theme";
import { useUiSize } from "@/lib/UiSizeProvider";

export type LookupStatusBadgeProps = {
  readonly badge: Exclude<LookupLibraryBadge, "none">;
};

const TONE = {
  inLibrary: {
    backgroundColor: "rgba(154, 149, 140, 0.18)",
    color: colors.secondary,
  },
  alreadyDownloaded: {
    backgroundColor: "rgba(111, 191, 122, 0.18)",
    color: colors.success,
  },
} as const;

export const LookupStatusBadge = ({ badge }: LookupStatusBadgeProps) => {
  const { t } = useI18n();
  const { fontSize } = useUiSize();
  const tone = TONE[badge];
  const label =
    badge === "alreadyDownloaded"
      ? t("add.alreadyDownloaded")
      : t("add.inLibrary");
  return (
    <View
      accessibilityLabel={label}
      style={[styles.pill, { backgroundColor: tone.backgroundColor }]}
    >
      <Text
        style={[
          styles.label,
          { color: tone.color, fontSize: fontSize(12) },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    alignSelf: "flex-start",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  label: {
    fontFamily: fonts.uiMedium,
  },
});
