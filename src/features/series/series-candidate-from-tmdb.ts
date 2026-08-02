import type { SeriesCandidate } from "@/arr-client";
import type { TmdbMediaHit } from "@/tmdb-client";

/**
 * Builds a SeriesCandidate from a TMDB hit plus resolved TVDB id.
 */
export const seriesCandidateFromTmdb = (input: {
  readonly tvdbId: number;
  readonly hit: TmdbMediaHit;
}): SeriesCandidate => ({
  tvdbId: input.tvdbId,
  title: input.hit.title,
  year: input.hit.year,
  posterUrl: input.hit.posterUrl,
  inLibrary: false,
  episodeFileCount: 0,
  episodeCount: 0,
  overview: input.hit.overview,
  genres: [],
  runtimeMinutes: undefined,
  libraryId: undefined,
});
