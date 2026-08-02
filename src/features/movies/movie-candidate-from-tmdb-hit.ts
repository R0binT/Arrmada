import type { MovieCandidate } from "@/arr-client";
import type { TmdbMediaHit } from "@/tmdb-client";

/**
 * Builds a MovieCandidate from a TMDB media hit without Arr library state.
 */
export const movieCandidateFromTmdbHit = (
  hit: TmdbMediaHit,
): MovieCandidate => ({
  tmdbId: hit.tmdbId,
  title: hit.title,
  year: hit.year,
  posterUrl: hit.posterUrl,
  overview: hit.overview,
  inLibrary: false,
  hasFile: false,
  libraryId: undefined,
  genres: [],
  runtimeMinutes: undefined,
});
