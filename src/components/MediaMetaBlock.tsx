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

type ChipRowProps = {
  readonly chips: readonly MetaChip[];
  readonly gap: number;
};

const ChipRow = ({ chips, gap }: ChipRowProps) => {
  if (chips.length === 0) return null;
  return (
    <View style={[styles.row, { gap }]}>
      {chips.map((chip) => (
        <Chip key={`${chip.tone}-${chip.label}`} tone={chip.tone}>
          {chip.label}
        </Chip>
      ))}
    </View>
  );
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
  const identity: MetaChip[] = [];
  pushChip(identity, certification, "neutral");
  if (runtimeMinutes !== undefined && runtimeMinutes > 0) {
    pushChip(identity, formatRuntimeMinutes(runtimeMinutes), "neutral");
  }
  pushChip(identity, originalLanguage, "neutral");
  pushChip(identity, networkOrStudio, "neutral");
  const normalizedStatus = statusLabel?.trim().toLowerCase();
  if (normalizedStatus && normalizedStatus !== "released") {
    pushChip(identity, statusLabel, "neutral");
  }

  const genresRow: MetaChip[] = [];
  for (const genre of genres.slice(0, 4)) {
    pushChip(genresRow, genre, "accent");
  }
  pushChip(genresRow, collectionTitle, "accent");

  const library: MetaChip[] = [];
  pushChip(library, fileQuality, "success");
  if (sizeOnDisk !== undefined && sizeOnDisk > 0) {
    pushChip(library, formatSizeBytes(sizeOnDisk), "success");
  }
  const addedLabel = formatAddedDate(added);
  if (addedLabel) {
    pushChip(library, t("mediaQuick.addedOn", { date: addedLabel }), "success");
  }

  const dates: MetaChip[] = [];
  const release = formatAirDate(releaseDate);
  if (release) {
    pushChip(dates, t("mediaQuick.releaseDate", { date: release }), "info");
  }
  const first = formatAirDate(firstAired);
  if (first) {
    pushChip(dates, t("detail.firstAired", { date: first }), "info");
  }
  const last = formatAirDate(lastAired);
  if (last) {
    pushChip(dates, t("detail.lastAired", { date: last }), "info");
  }

  if (
    identity.length === 0 &&
    genresRow.length === 0 &&
    library.length === 0 &&
    dates.length === 0
  ) {
    return null;
  }

  return (
    <View style={{ gap: space.sm, marginBottom: space.md }}>
      <ChipRow chips={identity} gap={space.xs} />
      <ChipRow chips={genresRow} gap={space.xs} />
      <ChipRow chips={library} gap={space.xs} />
      <ChipRow chips={dates} gap={space.xs} />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
});
