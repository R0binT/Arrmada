import type { SeriesCandidate } from "@/arr-client";

import {
  findSeriesCandidateInLookupPages,
  resolveSeriesCandidatePreview,
} from "../resolve-series-candidate-preview";

const cached: SeriesCandidate = {
  tvdbId: 121361,
  title: "Game of Thrones",
  year: 2011,
  posterUrl: undefined,
  inLibrary: false,
  episodeFileCount: 0,
  episodeCount: 0,
  overview: "Winter is coming.",
  genres: [],
  runtimeMinutes: undefined,
  libraryId: undefined,
};

describe("findSeriesCandidateInLookupPages", () => {
  it("returns the matching candidate from cached lookup pages", () => {
    const actual = findSeriesCandidateInLookupPages(
      [{ items: [cached] }],
      121361,
    );
    expect(actual).toEqual(cached);
  });
});

describe("resolveSeriesCandidatePreview", () => {
  it("uses lookup cache when Arr is unreachable without calling Arr", async () => {
    const lookupByTvdbId = jest.fn(async (): Promise<SeriesCandidate | null> => {
      throw new Error("Arr should not be called");
    });

    const actual = await resolveSeriesCandidatePreview({
      tvdbId: 121361,
      arrUnreachable: true,
      lookupByTvdbId,
      cachedCandidate: cached,
    });

    expect(lookupByTvdbId).not.toHaveBeenCalled();
    expect(actual).toEqual(cached);
  });
});
