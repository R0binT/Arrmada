import { View } from "react-native";

import type { LookupLibraryBadge } from "@/features/library/lookup-library-status";
import { useI18n } from "@/i18n";
import { Chip } from "@/ui/Chip";

export type LookupStatusBadgeProps = {
  readonly badge: Exclude<LookupLibraryBadge, "none">;
};

export const LookupStatusBadge = ({ badge }: LookupStatusBadgeProps) => {
  const { t } = useI18n();
  const tone = badge === "alreadyDownloaded" ? "success" : "neutral";
  const label =
    badge === "alreadyDownloaded"
      ? t("add.alreadyDownloaded")
      : t("add.inLibrary");

  return (
    <View accessibilityLabel={label}>
      <Chip tone={tone}>{label}</Chip>
    </View>
  );
};
