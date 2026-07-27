import { StyleSheet, View } from "react-native";

import {
  formatAddedDate,
  formatRuntimeMinutes,
  formatSizeBytes,
} from "@/features/media-quick/format-media-meta";
import { t } from "@/i18n";
import { useUiSize } from "@/lib/UiSizeProvider";
import { Chip } from "@/ui/Chip";
import type { ChipTone } from "@/ui/variant-styles";

type MediaMetaBlockProps = {
  readonly genres: readonly string[];
  readonly runtimeMinutes: number | undefined;
  readonly networkOrStudio: string | undefined;
  readonly added: string | undefined;
  readonly fileQuality?: string | undefined;
  readonly sizeOnDisk?: number | undefined;
};

type MetaChip = {
  readonly label: string;
  readonly tone: ChipTone;
};

export const MediaMetaBlock = ({
  genres,
  runtimeMinutes,
  networkOrStudio,
  added,
  fileQuality,
  sizeOnDisk,
}: MediaMetaBlockProps) => {
  const { space } = useUiSize();
  const chips: MetaChip[] = [];
  for (const genre of genres.slice(0, 4)) {
    const trimmed = genre.trim();
    if (trimmed.length > 0) {
      chips.push({ label: trimmed, tone: "accent" });
    }
  }
  if (runtimeMinutes !== undefined && runtimeMinutes > 0) {
    chips.push({
      label: formatRuntimeMinutes(runtimeMinutes),
      tone: "neutral",
    });
  }
  if (networkOrStudio && networkOrStudio.trim().length > 0) {
    chips.push({ label: networkOrStudio.trim(), tone: "neutral" });
  }
  const addedLabel = formatAddedDate(added);
  if (addedLabel) {
    chips.push({
      label: t("mediaQuick.addedOn", { date: addedLabel }),
      tone: "info",
    });
  }
  if (fileQuality && fileQuality.trim().length > 0) {
    chips.push({ label: fileQuality.trim(), tone: "warning" });
  }
  if (sizeOnDisk !== undefined && sizeOnDisk > 0) {
    chips.push({ label: formatSizeBytes(sizeOnDisk), tone: "success" });
  }
  if (chips.length === 0) {
    return null;
  }
  return (
    <View
      style={[
        styles.wrap,
        { gap: space.xs, marginBottom: space.md },
      ]}
    >
      {chips.map((chip) => (
        <Chip key={`${chip.tone}-${chip.label}`} tone={chip.tone}>
          {chip.label}
        </Chip>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
});
