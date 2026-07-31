import type { ReleaseOffer } from "@/arr-client";

import {
  smartGrabReleases,
  type SmartGrabOutcome,
} from "@/features/releases/smart-grab";

export type AfterAddDownloadResult =
  | SmartGrabOutcome
  | { readonly type: "arrSearchStarted" };

type GrabFn = (
  release: Pick<ReleaseOffer, "guid" | "indexerId">,
) => Promise<unknown>;

/**
 * After Sonarr add: start Arr SeriesSearch so missing episodes download
 * without racing per-episode /release lookups (those often time out and
 * previously surfaced as false Wi‑Fi errors).
 */
export const startSeriesDownloadAfterAdd = async (input: {
  readonly seriesId: number;
  readonly seriesSearch: (seriesId: number) => Promise<unknown>;
}): Promise<AfterAddDownloadResult> => {
  await input.seriesSearch(input.seriesId);
  return { type: "arrSearchStarted" };
};

/**
 * After Radarr add: try one client-side smart grab; fall back to MoviesSearch.
 */
export const startMovieDownloadAfterAdd = async (input: {
  readonly movieId: number;
  readonly getMovieReleases: (movieId: number) => Promise<ReleaseOffer[]>;
  readonly moviesSearch: (movieId: number) => Promise<unknown>;
  readonly grab: GrabFn;
}): Promise<AfterAddDownloadResult> => {
  try {
    const releases = await input.getMovieReleases(input.movieId);
    const outcome = await smartGrabReleases(releases, input.grab);
    if (outcome.type !== "empty") {
      return outcome;
    }
  } catch {
    // Fall through to Arr-native search.
  }
  await input.moviesSearch(input.movieId);
  return { type: "arrSearchStarted" };
};
