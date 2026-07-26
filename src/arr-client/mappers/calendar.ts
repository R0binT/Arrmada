import { getPosterUrl } from "./movie";
import type { CalendarEpisode, CalendarMovie } from "../types";

const asRecord = (raw: unknown): Record<string, unknown> | null => {
  if (typeof raw !== "object" || raw === null) return null;
  return raw as Record<string, unknown>;
};

const pickMovieReleaseDate = (obj: Record<string, unknown>): string | undefined => {
  const candidates = [obj.digitalRelease, obj.physicalRelease, obj.inCinemas];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate;
    }
  }
  return undefined;
};

export const mapCalendarMovie = (
  raw: unknown,
  baseUrl: string,
): CalendarMovie | null => {
  const obj = asRecord(raw);
  if (!obj || obj.id === undefined) return null;
  const releaseDate = pickMovieReleaseDate(obj);
  if (!releaseDate) return null;
  return {
    id: Number(obj.id),
    title: String(obj.title ?? ""),
    year: Number(obj.year ?? 0),
    posterUrl: getPosterUrl(obj.images, baseUrl),
    hasFile: Boolean(obj.hasFile),
    statusSummary: String(obj.status ?? ""),
    releaseDate,
  };
};

export const mapCalendarEpisode = (
  raw: unknown,
  baseUrl: string,
): CalendarEpisode | null => {
  const obj = asRecord(raw);
  if (!obj || obj.id === undefined) return null;
  const series = asRecord(obj.series);
  const seriesId =
    typeof obj.seriesId === "number"
      ? obj.seriesId
      : typeof series?.id === "number"
        ? series.id
        : undefined;
  if (seriesId === undefined) return null;
  const airDateUtc =
    typeof obj.airDateUtc === "string"
      ? obj.airDateUtc
      : typeof obj.airDate === "string"
        ? obj.airDate
        : undefined;
  return {
    id: Number(obj.id),
    seriesId,
    seriesTitle: String(series?.title ?? obj.seriesTitle ?? "").trim(),
    episodeTitle: String(obj.title ?? "").trim(),
    seasonNumber: Number(obj.seasonNumber ?? 0),
    episodeNumber: Number(obj.episodeNumber ?? 0),
    posterUrl: getPosterUrl(series?.images ?? obj.images, baseUrl),
    hasFile: Boolean(obj.hasFile),
    airDateUtc,
  };
};
