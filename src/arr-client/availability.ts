export type Availability = "aVenir" | "aTelecharger" | "dispo";

export type AvailabilityInput = {
  readonly hasFile: boolean;
  readonly isOut: boolean;
};

export const classifyAvailability = (
  input: AvailabilityInput,
): Availability => {
  if (input.hasFile) return "dispo";
  if (!input.isOut) return "aVenir";
  return "aTelecharger";
};

export const isMovieOut = (statusSummary: string): boolean =>
  statusSummary.trim().toLowerCase() === "released";

export const isEpisodeOut = (
  airDateUtc: string | undefined,
  now: Date,
): boolean => {
  if (!airDateUtc) return false;
  const airMs = Date.parse(airDateUtc);
  if (Number.isNaN(airMs)) return false;
  return airMs <= now.getTime();
};

export const classifyMovie = (movie: {
  readonly hasFile: boolean;
  readonly statusSummary: string;
}): Availability =>
  classifyAvailability({
    hasFile: movie.hasFile,
    isOut: isMovieOut(movie.statusSummary),
  });

export const classifyEpisode = (
  episode: {
    readonly hasFile: boolean;
    readonly airDateUtc?: string;
  },
  now: Date = new Date(),
): Availability =>
  classifyAvailability({
    hasFile: episode.hasFile,
    isOut: isEpisodeOut(episode.airDateUtc, now),
  });

/**
 * Series-level "out": Sonarr `upcoming` is not out; otherwise treat as out
 * when Sonarr already counts episodes (aired / expected).
 */
export const isSeriesOut = (
  statusSummary: string,
  episodeCount: number,
): boolean => {
  const status = statusSummary.trim().toLowerCase();
  if (!status || status === "upcoming") return false;
  return episodeCount > 0;
};

/** Dispo when every counted episode has a file. */
export const seriesHasExpectedFiles = (series: {
  readonly episodeFileCount: number;
  readonly episodeCount: number;
}): boolean =>
  series.episodeCount > 0 && series.episodeFileCount >= series.episodeCount;

export const classifySeries = (series: {
  readonly episodeFileCount: number;
  readonly episodeCount: number;
  readonly statusSummary: string;
}): Availability =>
  classifyAvailability({
    hasFile: seriesHasExpectedFiles(series),
    isOut: isSeriesOut(series.statusSummary, series.episodeCount),
  });

/** Télécharger only when out/aired and the file is not on disk yet. */
export const canOfferDownload = (availability: Availability): boolean =>
  availability === "aTelecharger";

/** Season action: offer download if any aired episode still lacks a file. */
export const seasonNeedsDownload = (season: {
  readonly episodes: readonly { readonly availability: Availability }[];
}): boolean =>
  season.episodes.some((episode) => canOfferDownload(episode.availability));
