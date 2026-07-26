import type { ArrService, QueueItem, QueueStatus } from "../types";
import { getPosterUrl } from "./movie";

const asRecord = (raw: unknown): Record<string, unknown> | null => {
  if (typeof raw !== "object" || raw === null) return null;
  return raw as Record<string, unknown>;
};

export const computeProgress = (size: number, sizeLeft: number): number => {
  if (size <= 0) return 0;
  return (size - sizeLeft) / size;
};

const normalizeQueueStatus = (
  status: unknown,
  trackedDownloadState: unknown,
): QueueStatus => {
  const combined =
    `${String(status ?? "")} ${String(trackedDownloadState ?? "")}`.toLowerCase();

  if (combined.includes("download")) return "downloading";
  if (combined.includes("queue")) return "queued";
  if (combined.includes("pause")) return "paused";
  if (combined.includes("warn") || combined.includes("stall")) return "stalled";
  if (combined.includes("fail")) return "failed";
  if (combined.includes("complete")) return "completed";
  return "unknown";
};

const parseEtaSeconds = (timeleft: unknown): number | undefined => {
  if (typeof timeleft !== "string" || timeleft.length === 0) return undefined;

  const parts = timeleft.split(":").map((part) => Number(part));
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
    return undefined;
  }

  const [hours, minutes, seconds] = parts;
  return hours * 3600 + minutes * 60 + seconds;
};

const extractPosterFromQueueItem = (
  obj: Record<string, unknown>,
  baseUrl: string,
): string | undefined => {
  const movie = asRecord(obj.movie);
  if (movie) return getPosterUrl(movie.images, baseUrl);

  const series = asRecord(obj.series);
  if (series) return getPosterUrl(series.images, baseUrl);

  return getPosterUrl(obj.images, baseUrl);
};

const episodeCode = (
  seasonNumber: unknown,
  episodeNumber: unknown,
): string | undefined => {
  const season = Number(seasonNumber);
  const episode = Number(episodeNumber);
  if (!Number.isFinite(season) || !Number.isFinite(episode)) return undefined;
  return `S${String(season).padStart(2, "0")}E${String(episode).padStart(2, "0")}`;
};

/**
 * Prefer media title over release/filename (`obj.title`), which is often unreadable.
 */
export const resolveQueueDisplayTitle = (
  obj: Record<string, unknown>,
): string => {
  const movie = asRecord(obj.movie);
  const movieTitle = String(movie?.title ?? "").trim();
  if (movieTitle.length > 0) return movieTitle;

  const series = asRecord(obj.series);
  const episode = asRecord(obj.episode);
  const code = episodeCode(episode?.seasonNumber, episode?.episodeNumber);
  const episodeTitle = String(episode?.title ?? "").trim();

  if (code && episodeTitle.length > 0) {
    return `${code} · ${episodeTitle}`;
  }
  if (episodeTitle.length > 0) return episodeTitle;
  if (code) {
    const seriesTitle = String(series?.title ?? "").trim();
    return seriesTitle.length > 0 ? `${seriesTitle} · ${code}` : code;
  }

  const seriesTitle = String(series?.title ?? "").trim();
  if (seriesTitle.length > 0) return seriesTitle;

  return String(obj.title ?? "").trim();
};

export const mapQueueItem = (
  raw: unknown,
  service: ArrService,
  baseUrl: string,
): QueueItem => {
  const obj = asRecord(raw);
  if (!obj) {
    throw new Error("Invalid queue item payload");
  }

  const size = Number(obj.size ?? 0);
  const sizeLeft = Number(obj.sizeleft ?? obj.sizeLeft ?? 0);
  const status = normalizeQueueStatus(obj.status, obj.trackedDownloadState);
  const movie = asRecord(obj.movie);
  const series = asRecord(obj.series);

  return {
    id: Number(obj.id),
    service,
    title: resolveQueueDisplayTitle(obj),
    posterUrl: extractPosterFromQueueItem(obj, baseUrl),
    status,
    progress: computeProgress(size, sizeLeft),
    size,
    sizeLeft,
    etaSeconds: parseEtaSeconds(obj.timeleft ?? obj.timeLeft),
    canPause: status === "downloading" || status === "paused",
    canGrab: status === "queued" || status === "failed",
    downloadId:
      typeof obj.downloadId === "string"
        ? obj.downloadId
        : typeof obj.downloadId === "number"
          ? String(obj.downloadId)
          : undefined,
    movieId: movie && typeof movie.id === "number" ? movie.id : undefined,
    seriesId: series && typeof series.id === "number" ? series.id : undefined,
  };
};
