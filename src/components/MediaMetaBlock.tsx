import { StyleSheet, View } from "react-native";

import {
  formatAddedDate,
  formatAirDate,
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
  readonly certification?: string | undefined;
  readonly originalLanguage?: string | undefined;
  readonly statusLabel?: string | undefined;
  readonly collectionTitle?: string | undefined;
  readonly releaseDate?: string | undefined;
  readonly firstAired?: string | undefined;
  readonly lastAired?: string | undefined;
};

type MetaChip = {
  readonly label: string;
  readonly tone: ChipTone;
};

const pushChip = (
  chips: MetaChip[],
  label: string | undefined,
  tone: ChipTone,
): void => {
  if (!label) return;
  const trimmed = label.trim();
  if (trimmed.length === 0) return;
  if (chips.some((chip) => chip.label === trimmed)) return;
  chips.push({ label: trimmed, tone });
};

export const MediaMetaBlock = ({
  genres,
  runtimeMinutes,
  networkOrStudio,
  added,
  fileQuality,
  sizeOnDisk,
  certification,
  originalLanguage,
  statusLabel,
  collectionTitle,
  releaseDate,
  firstAired,
  lastAired,
}: MediaMetaBlockProps) => {
  const { space } = useUiSize();
  const chips: MetaChip[] = [];
  pushChip(chips, certification, "warning");
  for (const genre of genres.slice(0, 4)) {
    pushChip(chips, genre, "accent");
  }
  if (runtimeMinutes !== undefined && runtimeMinutes > 0) {
    pushChip(chips, formatRuntimeMinutes(runtimeMinutes), "neutral");
  }
  pushChip(chips, originalLanguage, "neutral");
  pushChip(chips, networkOrStudio, "neutral");
  pushChip(chips, statusLabel, "info");
  pushChip(chips, collectionTitle, "accent");
  const release = formatAirDate(releaseDate);
  if (release) {
    pushChip(chips, t("mediaQuick.releaseDate", { date: release }), "info");
  }
  const first = formatAirDate(firstAired);
  if (first) {
    pushChip(chips, t("detail.firstAired", { date: first }), "info");
  }
  const last = formatAirDate(lastAired);
  if (last) {
    pushChip(chips, t("detail.lastAired", { date: last }), "info");
  }
  const addedLabel = formatAddedDate(added);
  if (addedLabel) {
    pushChip(chips, t("mediaQuick.addedOn", { date: addedLabel }), "info");
  }
  pushChip(chips, fileQuality, "warning");
  if (sizeOnDisk !== undefined && sizeOnDisk > 0) {
    pushChip(chips, formatSizeBytes(sizeOnDisk), "success");
  }
  if (chips.length === 0) {
    return null;
  }
  return (
    <View
      style={[styles.wrap, { gap: space.xs, marginBottom: space.md }]}
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
