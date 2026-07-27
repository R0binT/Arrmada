import { availabilityLabel, t } from "@/i18n";

import {
    formatAddedDate,
    formatAirDate,
    formatEpisodeCode,
    formatEpisodeProgress,
    formatEtaShort,
    formatRuntimeMinutes,
    formatSizeBytes,
} from "./format-media-meta";
import { queueStatusLabel } from "./queue-status-label";
import type {
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
      return "accent";
    case "aVenir":
      return "muted";
    case undefined:
      return "muted";
    default: {
      const _exhaustive: never = selection.availability;
      return _exhaustive;
    }
  }
};

const pushUnique = (lines: string[], value: string | undefined): void => {
  if (!value) return;
  const trimmed = value.trim();
  if (trimmed.length === 0) return;
  if (lines.includes(trimmed)) return;
  lines.push(trimmed);
};

const pushGenreChips = (
  chips: string[],
  genres: readonly string[] | undefined,
): void => {
  for (const genre of genres?.slice(0, 3) ?? []) {
    pushUnique(chips, genre);
  }
};

const pushRuntimeChip = (
  chips: string[],
  runtimeMinutes: number | undefined,
): void => {
  if (runtimeMinutes !== undefined && runtimeMinutes > 0) {
    pushUnique(chips, formatRuntimeMinutes(runtimeMinutes));
  }
};

const joinDetail = (parts: readonly string[]): string | undefined => {
  const cleaned = parts
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  return cleaned.length > 0 ? cleaned.join(" · ") : undefined;
};

type MetaBuckets = {
  readonly chips: string[];
  readonly detailParts: string[];
};

const buildMovieMeta = (selection: MediaQuickSelection): MetaBuckets => {
  const chips: string[] = [];
  const detailParts: string[] = [];
  pushGenreChips(chips, selection.genres);
  pushRuntimeChip(chips, selection.runtimeMinutes);
  pushUnique(chips, selection.networkOrStudio);
  const added = formatAddedDate(selection.added);
  if (added) detailParts.push(t("mediaQuick.addedOn", { date: added }));
  if (selection.availability === "dispo") {
    if (selection.fileQuality?.trim()) {
      detailParts.push(selection.fileQuality.trim());
    }
    if (selection.sizeOnDisk !== undefined && selection.sizeOnDisk > 0) {
      detailParts.push(formatSizeBytes(selection.sizeOnDisk));
    }
  }
  const air = formatAirDate(selection.airDate);
  if (air) detailParts.push(t("mediaQuick.releaseDate", { date: air }));
  return { chips, detailParts };
};

const buildSeriesMeta = (selection: MediaQuickSelection): MetaBuckets => {
  const chips: string[] = [];
  const detailParts: string[] = [];
  pushUnique(
    chips,
    formatEpisodeProgress(selection.episodeFileCount, selection.episodeCount),
  );
  pushGenreChips(chips, selection.genres);
  pushUnique(chips, selection.networkOrStudio);
  pushRuntimeChip(chips, selection.runtimeMinutes);
  const added = formatAddedDate(selection.added);
  if (added) detailParts.push(t("mediaQuick.addedOn", { date: added }));
  return { chips, detailParts };
};

const buildSeasonMeta = (selection: MediaQuickSelection): MetaBuckets => {
  const chips: string[] = [];
  const detailParts: string[] = [];
  pushUnique(
    chips,
    formatEpisodeProgress(selection.episodeFileCount, selection.episodeCount),
  );
  if (selection.year !== undefined && selection.year > 0) {
    pushUnique(chips, String(selection.year));
  }
  pushGenreChips(chips, selection.genres);
  pushUnique(chips, selection.networkOrStudio);
  pushRuntimeChip(chips, selection.runtimeMinutes);
  return { chips, detailParts };
};

const buildEpisodeMeta = (selection: MediaQuickSelection): MetaBuckets => {
  const chips: string[] = [];
  const detailParts: string[] = [];
  const code = formatEpisodeCode(
    selection.seasonNumber,
    selection.episodeNumber,
  );
  const air = formatAirDate(selection.airDate);
  if (code && air) {
    pushUnique(chips, `${code} · ${air}`);
  } else {
    pushUnique(chips, code);
    if (air) detailParts.push(`Diffusion ${air}`);
  }
  pushGenreChips(chips, selection.genres);
  pushUnique(chips, selection.networkOrStudio);
  pushRuntimeChip(chips, selection.runtimeMinutes);
  return { chips, detailParts };
};

const buildDownloadMeta = (selection: MediaQuickSelection): MetaBuckets => {
  const chips: string[] = [];
  const detailParts: string[] = [];
  if (selection.service === "radarr") pushUnique(chips, "Radarr");
  if (selection.service === "sonarr") pushUnique(chips, "Sonarr");
  pushUnique(chips, selection.subtitle);
  const code = formatEpisodeCode(
    selection.seasonNumber,
    selection.episodeNumber,
  );
  pushUnique(chips, code);
  if (selection.size !== undefined && selection.size > 0) {
    const downloaded = Math.max(0, selection.size - (selection.sizeLeft ?? 0));
    pushUnique(
      chips,
      `${formatSizeBytes(downloaded)} / ${formatSizeBytes(selection.size)}`,
    );
  } else if (selection.sizeLeft !== undefined && selection.sizeLeft > 0) {
    pushUnique(chips, `Reste ${formatSizeBytes(selection.sizeLeft)}`);
  }
  const eta = formatEtaShort(selection.etaSeconds);
  if (eta) pushUnique(chips, `ETA ${eta}`);
  return { chips, detailParts };
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
  const { chips, detailParts } = buildMeta(selection);
  const filteredChips = chips.filter((chip) => chip !== subtitle);
  const statusLine =
    selection.glanceStatusLine ?? buildStatusLine(selection);
  const statusTone =
    selection.glanceStatusTone ?? buildStatusTone(selection);

  return {
    title: resolveTitle(selection),
    subtitle,
    chips: filteredChips,
    detailLine: joinDetail(detailParts),
    statusLine,
    statusTone,
    progress: selection.kind === "download" ? selection.progress : undefined,
    destination: resolvePrimaryDestination(selection),
  };
};
