import type { SeriesCandidate } from "@/arr-client";

export type LookupCandidatePage = {
  readonly items: readonly SeriesCandidate[];
};

export type ResolveSeriesCandidatePreviewInput = {
  readonly tvdbId: number;
  readonly arrUnreachable: boolean;
  readonly lookupByTvdbId?: (
    tvdbId: number,
  ) => Promise<SeriesCandidate | null>;
  readonly cachedCandidate?: SeriesCandidate | null;
};

/**
 * Finds a series candidate in TMDB lookup cache pages (keyed by tvdbId).
 */
export const findSeriesCandidateInLookupPages = (
  pages: readonly LookupCandidatePage[] | undefined,
  tvdbId: number,
): SeriesCandidate | null => {
  if (pages === undefined) {
    return null;
  }
  for (const page of pages) {
    const found = page.items.find((item) => item.tvdbId === tvdbId);
    if (found !== undefined) {
      return found;
    }
  }
  return null;
};

/**
 * Loads an add-preview series from Arr when reachable, otherwise lookup cache.
 */
export const resolveSeriesCandidatePreview = async (
  input: ResolveSeriesCandidatePreviewInput,
): Promise<SeriesCandidate | null> => {
  if (!input.arrUnreachable) {
    if (input.lookupByTvdbId === undefined) {
      throw new Error("Sonarr is not configured.");
    }
    return input.lookupByTvdbId(input.tvdbId);
  }
  if (input.cachedCandidate === undefined || input.cachedCandidate === null) {
    return null;
  }
  return input.cachedCandidate;
};
