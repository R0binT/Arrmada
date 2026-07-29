import { availabilityLabel, t } from "@/i18n";
import { formatRatingLabel } from "@/arr-client/mappers/ratings";
import type { ChipTone } from "@/ui/variant-styles";

import {
  formatAirDate,
  formatEpisodeCode,
  formatEpisodeProgress,
  formatEtaShort,
  formatRuntimeMinutes,
  formatSizeBytes,
} from "./format-media-meta";
import { queueStatusLabel } from "./queue-status-label";
import type {
  MediaQuickChip,
  MediaQuickSelection,
  MediaQuickStatusTone,
  MediaQuickViewModel,
  PrimaryDestination,
} from "./types";

export const resolvePrimaryDestination = (
  selection: MediaQuickSelection,
): PrimaryDestination => {
  if (selection.movieId !== undefined) {
    return {
      href: {
        pathname: "/(tabs)/movies/[id]",
        params: { id: String(selection.movieId) },
      },
      ctaKey: "mediaQuick.seeDetail",
    };
  }

  if (
    selection.kind === "episode" &&
    selection.seriesId !== undefined &&
    selection.episodeId !== undefined
  ) {
    return {
      href: {
        pathname: "/(tabs)/series/[id]/episode/[episodeId]",
        params: {
          id: String(selection.seriesId),
          episodeId: String(selection.episodeId),
        },
      },
      ctaKey: "mediaQuick.seeDetail",
    };
  }

  if (selection.seriesId !== undefined) {
    return {
      href: {
        pathname: "/(tabs)/series/[id]",
        params: { id: String(selection.seriesId) },
      },
      ctaKey: "mediaQuick.seeDetail",
    };
  }

  return {
    href: "/(tabs)/queue",
    ctaKey: "mediaQuick.seeDownloads",
  };
};

const buildStatusLine = (selection: MediaQuickSelection): string => {
  if (selection.kind === "download") {
    const label = selection.queueStatus
      ? queueStatusLabel(selection.queueStatus)
      : t("queue.status.downloading");
    if (
      selection.progress !== undefined &&
      selection.progress > 0 &&
      selection.progress < 1
    ) {
      const percent = Math.round(selection.progress * 100);
      return `${label} · ${percent} %`;
    }
    return label;
  }

  if (selection.availability !== undefined) {
    return availabilityLabel(selection.availability);
  }

  return "";
};

const buildStatusTone = (
  selection: MediaQuickSelection,
): MediaQuickStatusTone => {
  if (selection.kind === "download") {
    if (selection.queueStatus === "failed") return "danger";
    if (selection.queueStatus === "completed") return "success";
    return "accent";
  }
  switch (selection.availability) {
    case "dispo":
      return "success";
    case "aTelecharger":
      return "info";
    case "aVenir":
      return "warning";
    case undefined:
      return "muted";
    default: {
      const _exhaustive: never = selection.availability;
      return _exhaustive;
    }
  }
};

const pushChip = (
  chips: MediaQuickChip[],
  value: string | undefined,
  tone: ChipTone = "neutral",
): void => {
  if (!value) return;
  const trimmed = value.trim();
  if (trimmed.length === 0) return;
  if (chips.some((chip) => chip.label === trimmed)) return;
  chips.push({ label: trimmed, tone });
};

const pushGenreChips = (
  chips: MediaQuickChip[],
  genres: readonly string[] | undefined,
): void => {
  for (const genre of genres?.slice(0, 3) ?? []) {
    pushChip(chips, genre, "accent");
  }
};

const pushRuntimeChip = (
  chips: MediaQuickChip[],
  runtimeMinutes: number | undefined,
): void => {
  if (runtimeMinutes !== undefined && runtimeMinutes > 0) {
    pushChip(chips, formatRuntimeMinutes(runtimeMinutes), "neutral");
  }
};

const pushEpisodeProgressChip = (
  chips: MediaQuickChip[],
  episodeFileCount: number | undefined,
  episodeCount: number | undefined,
): void => {
  const label = formatEpisodeProgress(episodeFileCount, episodeCount);
  if (!label) return;
  const isComplete =
    episodeCount !== undefined &&
    episodeCount > 0 &&
    episodeFileCount === episodeCount;
  pushChip(chips, label, isComplete ? "success" : "accent");
};

const cleanDetailParts = (parts: readonly string[]): readonly string[] =>
  parts.map((part) => part.trim()).filter((part) => part.length > 0);

const pushCastDetail = (
  detailParts: string[],
  castNames: readonly string[] | undefined,
): void => {
  if (!castNames || castNames.length === 0) return;
  const names = castNames
    .map((name) => name.trim())
    .filter((name) => name.length > 0)
    .slice(0, 6);
  if (names.length === 0) return;
  detailParts.push(`${t("mediaQuick.castLabel")}: ${names.join(", ")}`);
};

/** Prefer crew; otherwise cast. Never both. */
const pushPeopleDetail = (
  detailParts: string[],
  crewLine: string | undefined,
  castNames: readonly string[] | undefined,
): void => {
  if (crewLine?.trim()) {
    detailParts.push(crewLine.trim());
    return;
  }
  pushCastDetail(detailParts, castNames);
};

const pushRatingChips = (
  chips: MediaQuickChip[],
  selection: MediaQuickSelection,
): void => {
  const ratings = selection.ratings ?? [];
  const preferred = [...ratings].sort((left, right) => {
    const rank = (source: string): number => {
      if (source === "tmdb") return 0;
      if (source === "imdb") return 1;
      if (source === "rottenTomatoes") return 2;
      return 3;
    };
    return rank(left.source) - rank(right.source);
  });
  for (const score of preferred.slice(0, 2)) {
    pushChip(chips, formatRatingLabel(score), "warning");
  }
};

type MetaBuckets = {
  readonly chipRows: readonly (readonly MediaQuickChip[])[];
  readonly detailParts: string[];
};

const nonEmptyRows = (
  rows: readonly (readonly MediaQuickChip[])[],
): readonly (readonly MediaQuickChip[])[] =>
  rows.filter((row) => row.length > 0);

const buildMovieMeta = (selection: MediaQuickSelection): MetaBuckets => {
  const ratings: MediaQuickChip[] = [];
  const identity: MediaQuickChip[] = [];
  const genres: MediaQuickChip[] = [];
  const library: MediaQuickChip[] = [];
  const detailParts: string[] = [];
  pushRatingChips(ratings, selection);
  pushChip(identity, selection.certification, "neutral");
  pushRuntimeChip(identity, selection.runtimeMinutes);
  pushChip(identity, selection.networkOrStudio, "neutral");
  for (const genre of selection.genres?.slice(0, 2) ?? []) {
    pushChip(genres, genre, "accent");
  }
  if (selection.availability === "dispo" && selection.fileQuality?.trim()) {
    pushChip(library, selection.fileQuality.trim(), "success");
  }
  for (const code of selection.audioLanguageCodes ?? []) {
    pushChip(library, code, "info");
  }
  for (const code of selection.subtitleLanguageCodes ?? []) {
    pushChip(library, `ST ${code}`, "neutral");
  }
  const air = formatAirDate(selection.airDate);
  if (air) detailParts.push(t("mediaQuick.releaseDate", { date: air }));
  pushPeopleDetail(detailParts, selection.crewLine, selection.castNames);
  return {
    chipRows: nonEmptyRows([ratings, identity, genres, library]),
    detailParts,
  };
};

const buildSeriesMeta = (selection: MediaQuickSelection): MetaBuckets => {
  const progress: MediaQuickChip[] = [];
  const ratings: MediaQuickChip[] = [];
  const identity: MediaQuickChip[] = [];
  const genres: MediaQuickChip[] = [];
  const detailParts: string[] = [];
  pushEpisodeProgressChip(
    progress,
    selection.episodeFileCount,
    selection.episodeCount,
  );
  const progressRow: MediaQuickChip[] = progress.map((chip) => ({
    label: chip.label,
    tone: "success",
  }));
  pushRatingChips(ratings, selection);
  pushChip(identity, selection.certification, "neutral");
  pushRuntimeChip(identity, selection.runtimeMinutes);
  pushChip(identity, selection.networkOrStudio, "neutral");
  for (const genre of selection.genres?.slice(0, 2) ?? []) {
    pushChip(genres, genre, "accent");
  }
  const air = formatAirDate(selection.airDate);
  if (air) detailParts.push(t("mediaQuick.releaseDate", { date: air }));
  pushPeopleDetail(detailParts, selection.crewLine, selection.castNames);
  return {
    chipRows: nonEmptyRows([progressRow, ratings, identity, genres]),
    detailParts,
  };
};

const buildSeasonMeta = (selection: MediaQuickSelection): MetaBuckets => {
  const progress: MediaQuickChip[] = [];
  const identity: MediaQuickChip[] = [];
  const genres: MediaQuickChip[] = [];
  pushEpisodeProgressChip(
    progress,
    selection.episodeFileCount,
    selection.episodeCount,
  );
  const progressRow: MediaQuickChip[] = progress.map((chip) => ({
    label: chip.label,
    tone: "success" as const,
  }));
  if (selection.year !== undefined && selection.year > 0) {
    pushChip(identity, String(selection.year), "neutral");
  }
  pushChip(identity, selection.networkOrStudio, "neutral");
  pushRuntimeChip(identity, selection.runtimeMinutes);
  pushGenreChips(genres, selection.genres);
  return {
    chipRows: nonEmptyRows([progressRow, identity, genres]),
    detailParts: [],
  };
};

const buildEpisodeMeta = (selection: MediaQuickSelection): MetaBuckets => {
  const schedule: MediaQuickChip[] = [];
  const identity: MediaQuickChip[] = [];
  const genres: MediaQuickChip[] = [];
  const detailParts: string[] = [];
  const code = formatEpisodeCode(
    selection.seasonNumber,
    selection.episodeNumber,
  );
  const air = formatAirDate(selection.airDate);
  if (code && air) {
    pushChip(schedule, `${code} · ${air}`, "info");
  } else {
    pushChip(schedule, code, "info");
    if (air) detailParts.push(`Diffusion ${air}`);
  }
  pushChip(identity, selection.networkOrStudio, "neutral");
  pushRuntimeChip(identity, selection.runtimeMinutes);
  pushGenreChips(genres, selection.genres);
  const library: MediaQuickChip[] = [];
  for (const code of selection.audioLanguageCodes ?? []) {
    pushChip(library, code, "info");
  }
  for (const code of selection.subtitleLanguageCodes ?? []) {
    pushChip(library, `ST ${code}`, "neutral");
  }
  return {
    chipRows: nonEmptyRows([schedule, identity, genres, library]),
    detailParts,
  };
};

const buildDownloadMeta = (selection: MediaQuickSelection): MetaBuckets => {
  const service: MediaQuickChip[] = [];
  const transfer: MediaQuickChip[] = [];
  if (selection.service === "radarr") pushChip(service, "Radarr", "accent");
  if (selection.service === "sonarr") pushChip(service, "Sonarr", "accent");
  pushChip(service, selection.subtitle, "accent");
  const code = formatEpisodeCode(
    selection.seasonNumber,
    selection.episodeNumber,
  );
  pushChip(service, code, "accent");
  if (selection.size !== undefined && selection.size > 0) {
    const downloaded = Math.max(0, selection.size - (selection.sizeLeft ?? 0));
    pushChip(
      transfer,
      `${formatSizeBytes(downloaded)} / ${formatSizeBytes(selection.size)}`,
      "warning",
    );
  } else if (selection.sizeLeft !== undefined && selection.sizeLeft > 0) {
    pushChip(transfer, `Reste ${formatSizeBytes(selection.sizeLeft)}`, "warning");
  }
  const eta = formatEtaShort(selection.etaSeconds);
  if (eta) pushChip(transfer, `ETA ${eta}`, "warning");
  return {
    chipRows: nonEmptyRows([service, transfer]),
    detailParts: [],
  };
};

const buildMeta = (selection: MediaQuickSelection): MetaBuckets => {
  switch (selection.kind) {
    case "movie":
      return buildMovieMeta(selection);
    case "series":
      return buildSeriesMeta(selection);
    case "season":
      return buildSeasonMeta(selection);
    case "episode":
      return buildEpisodeMeta(selection);
    case "download":
      return buildDownloadMeta(selection);
    default: {
      const _exhaustive: never = selection.kind;
      return _exhaustive;
    }
  }
};

const resolveTitle = (selection: MediaQuickSelection): string => {
  if (selection.kind === "episode") {
    const episodeTitle = selection.title.trim();
    if (episodeTitle.length > 0) return episodeTitle;
    return (
      formatEpisodeCode(selection.seasonNumber, selection.episodeNumber) ??
      t("detail.fallbackEpisode")
    );
  }
  return selection.title;
};

const resolveSubtitle = (
  selection: MediaQuickSelection,
): string | undefined => {
  if (selection.subtitle && selection.subtitle.trim().length > 0) {
    return selection.subtitle.trim();
  }
  if (
    selection.kind === "movie" &&
    selection.year !== undefined &&
    selection.year > 0
  ) {
    return String(selection.year);
  }
  if (
    selection.kind === "series" &&
    selection.year !== undefined &&
    selection.year > 0
  ) {
    return String(selection.year);
  }
  return undefined;
};

export const buildMediaQuickViewModel = (
  selection: MediaQuickSelection,
): MediaQuickViewModel => {
  const subtitle = resolveSubtitle(selection);
  const { chipRows, detailParts } = buildMeta(selection);
  const filteredRows = nonEmptyRows(
    chipRows.map((row) =>
      row.filter((chip) => chip.label !== subtitle),
    ),
  );
  const statusLine =
    selection.glanceStatusLine ?? buildStatusLine(selection);
  const statusTone =
    selection.glanceStatusTone ?? buildStatusTone(selection);

  return {
    title: resolveTitle(selection),
    subtitle,
    posterUrl: selection.posterUrl,
    chipRows: filteredRows,
    detailLines: cleanDetailParts(detailParts),
    statusLine,
    statusTone,
    progress: selection.kind === "download" ? selection.progress : undefined,
    destination: resolvePrimaryDestination(selection),
  };
};
