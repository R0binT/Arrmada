import { classifyEpisode } from "../availability";
import type { Episode, Season, Series, SeriesCandidate } from "../types";
import { getPosterUrl } from "./movie";

const asRecord = (raw: unknown): Record<string, unknown> | null => {
  if (typeof raw !== "object" || raw === null) return null;
  return raw as Record<string, unknown>;
};

const mapQualityProfileId = (raw: unknown): number | undefined =>
  typeof raw === "number" ? raw : undefined;

const mapStringArray = (raw: unknown): readonly string[] =>
  Array.isArray(raw)
    ? raw.filter((item): item is string => typeof item === "string")
    : [];

const mapOptionalNumber = (raw: unknown): number | undefined =>
  typeof raw === "number" ? raw : undefined;

const mapOptionalString = (raw: unknown): string | undefined =>
  typeof raw === "string" ? raw : undefined;

export const mapSonarrSeries = (raw: unknown, baseUrl: string): Series => {
  const obj = asRecord(raw);
  if (!obj) {
    throw new Error("Invalid series payload");
  }

  const statistics = asRecord(obj.statistics);

  const added =
    typeof obj.added === "string"
      ? obj.added
      : typeof obj.dateAdded === "string"
        ? obj.dateAdded
        : undefined;

  return {
    id: Number(obj.id),
    title: String(obj.title ?? ""),
    year: Number(obj.year ?? 0),
    posterUrl: getPosterUrl(obj.images, baseUrl),
    monitored: Boolean(obj.monitored),
    episodeFileCount: Number(
      statistics?.episodeFileCount ?? obj.episodeFileCount ?? 0,
    ),
    episodeCount: Number(statistics?.episodeCount ?? obj.episodeCount ?? 0),
    statusSummary: String(obj.status ?? ""),
    added,
    overview: String(obj.overview ?? ""),
    qualityProfileId: mapQualityProfileId(obj.qualityProfileId),
    genres: mapStringArray(obj.genres),
    runtimeMinutes: mapOptionalNumber(obj.runtime),
    network: mapOptionalString(obj.network),
  };
};

export const mapSeriesCandidate = (
  raw: unknown,
  baseUrl: string,
): SeriesCandidate | null => {
  const obj = asRecord(raw);
  if (!obj || typeof obj.tvdbId !== "number") return null;

  const statistics = asRecord(obj.statistics);
  const id = typeof obj.id === "number" ? obj.id : 0;
  return {
    tvdbId: obj.tvdbId,
    title: String(obj.title ?? ""),
    year: Number(obj.year ?? 0),
    posterUrl: getPosterUrl(obj.images, baseUrl),
    inLibrary: id > 0,
    episodeFileCount: Number(
      statistics?.episodeFileCount ?? obj.episodeFileCount ?? 0,
    ),
    episodeCount: Number(statistics?.episodeCount ?? obj.episodeCount ?? 0),
  };
};

export const mapSonarrEpisode = (
  raw: unknown,
  now: Date = new Date(),
): Episode => {
  const obj = asRecord(raw);
  if (!obj) {
    throw new Error("Invalid episode payload");
  }

  const hasFile = Boolean(obj.hasFile);
  const airDateUtc = mapOptionalString(obj.airDateUtc);

  return {
    id: Number(obj.id),
    seasonNumber: Number(obj.seasonNumber ?? 0),
    episodeNumber: Number(obj.episodeNumber ?? 0),
    title: String(obj.title ?? ""),
    airDateUtc,
    hasFile,
    monitored: Boolean(obj.monitored),
    availability: classifyEpisode({ hasFile, airDateUtc }, now),
  };
};

export const groupEpisodesIntoSeasons = (
  episodes: readonly Episode[],
): Season[] => {
  const bySeason = new Map<number, Episode[]>();

  for (const episode of episodes) {
    const existing = bySeason.get(episode.seasonNumber);
    if (existing) {
      existing.push(episode);
    } else {
      bySeason.set(episode.seasonNumber, [episode]);
    }
  }

  return [...bySeason.entries()]
    .sort(([left], [right]) => left - right)
    .map(([seasonNumber, seasonEpisodes]) => ({
      seasonNumber,
      episodes: [...seasonEpisodes].sort(
        (left, right) => left.episodeNumber - right.episodeNumber,
      ),
    }));
};
