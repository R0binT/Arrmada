import type { MovieCandidate } from "@/arr-client";
import type { TmdbMediaHit } from "@/tmdb-client";

import { movieCandidateFromTmdbHit } from "./movie-candidate-from-tmdb-hit";

export type ResolveMovieCandidatePreviewInput = {
  readonly tmdbId: number;
  readonly arrUnreachable: boolean;
  readonly lookupByTmdbId?: (
    tmdbId: number,
  ) => Promise<MovieCandidate | null>;
  readonly getTmdbMovie?: (tmdbId: number) => Promise<TmdbMediaHit>;
};

/**
 * Loads an add-preview movie from Arr when reachable, otherwise TMDB only.
 */
export const resolveMovieCandidatePreview = async (
  input: ResolveMovieCandidatePreviewInput,
): Promise<MovieCandidate | null> => {
  if (!input.arrUnreachable) {
    if (input.lookupByTmdbId === undefined) {
      throw new Error("Radarr is not configured.");
    }
    return input.lookupByTmdbId(input.tmdbId);
  }
  if (input.getTmdbMovie === undefined) {
    return null;
  }
  const hit = await input.getTmdbMovie(input.tmdbId);
  return movieCandidateFromTmdbHit(hit);
};
