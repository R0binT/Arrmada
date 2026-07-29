import { classifyEpisode } from "../availability";
import type {
  Episode,
  ExternalIds,
  Season,
  Series,
  SeriesCandidate,
} from "../types";
import { mapMediaInfoLanguageCodes } from "./media-info-languages";
import { getPosterUrl } from "./movie";
import { mapRatings } from "./ratings";

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

const mapOriginalLanguage = (raw: unknown): string | undefined => {
  if (typeof raw === "string" && raw.trim().length > 0) return raw.trim();
  const obj = asRecord(raw);
  const name = mapOptionalString(obj?.name);
  return name && name.trim().length > 0 ? name.trim() : undefined;
};

const mapSeriesExternalIds = (
  obj: Record<string, unknown>,
  tvMazeId: number | undefined,
): ExternalIds => {
  const imdbId = mapOptionalString(obj.imdbId);
  const tmdbId = mapOptionalNumber(obj.tmdbId);
  const tvdbId = mapOptionalNumber(obj.tvdbId);
  return {
    imdbId: imdbId && imdbId.trim().length > 0 ? imdbId.trim() : undefined,
    tmdbId: tmdbId !== undefined && tmdbId > 0 ? tmdbId : undefined,
    tvdbId: tvdbId !== undefined && tvdbId > 0 ? tvdbId : undefined,
    tvMazeId,
  };
};

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

  const tvMazeRaw = mapOptionalNumber(obj.tvMazeId);
  const tvMazeId =
    tvMazeRaw !== undefined && tvMazeRaw > 0 ? tvMazeRaw : undefined;
  const certification = mapOptionalString(obj.certification);

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
    tvMazeId,
    ratings: mapRatings(obj.ratings),
    certification:
      certification && certification.trim().length > 0
        ? certification.trim()
        : undefined,
    originalLanguage: mapOriginalLanguage(obj.originalLanguage),
    ended: typeof obj.ended === "boolean" ? obj.ended : undefined,
    firstAired: mapOptionalString(obj.firstAired),
    lastAired: mapOptionalString(obj.lastAired),
    externalIds: mapSeriesExternalIds(obj, tvMazeId),
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
    overview: String(obj.overview ?? ""),
    genres: mapStringArray(obj.genres),
    runtimeMinutes: mapOptionalNumber(obj.runtime),
    libraryId: id > 0 ? id : undefined,
  };
};

export const mapSonarrEpisode = (
  raw: unknown,
  now: Date = new Date(),
  fileLanguages?: {
    readonly audioLanguageCodes: readonly string[];
    readonly subtitleLanguageCodes: readonly string[];
  },
): Episode => {
  const obj = asRecord(raw);
  if (!obj) {
    throw new Error("Invalid episode payload");
  }

  const hasFile = Boolean(obj.hasFile);
  const airDateUtc = mapOptionalString(obj.airDateUtc);
  const embeddedFile = asRecord(obj.episodeFile);
  const fromEmbedded = mapMediaInfoLanguageCodes(
    embeddedFile?.mediaInfo,
    embeddedFile?.languages,
  );
  const audioLanguageCodes =
    fileLanguages?.audioLanguageCodes ?? fromEmbedded.audioLanguageCodes;
  const subtitleLanguageCodes =
    fileLanguages?.subtitleLanguageCodes ?? fromEmbedded.subtitleLanguageCodes;

  return {
    id: Number(obj.id),
    seasonNumber: Number(obj.seasonNumber ?? 0),
    episodeNumber: Number(obj.episodeNumber ?? 0),
    title: String(obj.title ?? ""),
    airDateUtc,
    hasFile,
    monitored: Boolean(obj.monitored),
    availability: classifyEpisode({ hasFile, airDateUtc }, now),
    audioLanguageCodes: hasFile ? audioLanguageCodes : [],
    subtitleLanguageCodes: hasFile ? subtitleLanguageCodes : [],
  };
};

export type EpisodeFileLanguageIndex = ReadonlyMap<
  number,
  {
    readonly audioLanguageCodes: readonly string[];
    readonly subtitleLanguageCodes: readonly string[];
  }
>;

/** Build episodeId → language codes from `/api/v3/episodefile` payloads. */
export const indexEpisodeFileLanguages = (
  rawFiles: readonly unknown[],
): EpisodeFileLanguageIndex => {
  const index = new Map<
    number,
    {
      readonly audioLanguageCodes: readonly string[];
      readonly subtitleLanguageCodes: readonly string[];
    }
  >();
  for (const raw of rawFiles) {
    const obj = asRecord(raw);
    if (!obj) continue;
    const episodeId = Number(obj.episodeId);
    if (!Number.isFinite(episodeId) || episodeId <= 0) continue;
    const codes = mapMediaInfoLanguageCodes(obj.mediaInfo, obj.languages);
    index.set(episodeId, codes);
  }
  return index;
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
