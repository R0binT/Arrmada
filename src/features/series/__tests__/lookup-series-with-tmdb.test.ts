import type { SeriesCandidate } from "@/arr-client";
import type { TmdbMediaHit, TmdbNamedMatch } from "@/tmdb-client";

import { LOOKUP_ENRICH_CAP } from "../../movies/lookup-movies-with-tmdb";
import {
  lookupSeriesWithTmdb,
  type TmdbSeriesSearchPort,
} from "../lookup-series-with-tmdb";

const emptyNamed = async (): Promise<readonly TmdbNamedMatch[]> => [];
const emptyHits = async (): Promise<readonly TmdbMediaHit[]> => [];

const createPort = (
  overrides: Partial<TmdbSeriesSearchPort> = {},
): TmdbSeriesSearchPort => ({
  searchCompanies: emptyNamed,
  searchKeywords: emptyNamed,
  searchTv: emptyHits,
  discoverTvByCompany: emptyHits,
  discoverTvByKeyword: emptyHits,
  getTvExternalIds: async () => ({ tvdbId: undefined }),
  ...overrides,
});

const gotHit: TmdbMediaHit = {
  tmdbId: 1399,
  title: "Game of Thrones",
  year: 2011,
  posterUrl: undefined,
  overview: "Nine noble families fight for control.",
};

const gotArr: SeriesCandidate = {
  tvdbId: 121361,
  title: "Game of Thrones",
  year: 2011,
  posterUrl: undefined,
  overview: "Nine noble families fight for control.",
  inLibrary: true,
  episodeFileCount: 73,
  episodeCount: 73,
  genres: ["Drama"],
  runtimeMinutes: 57,
  libraryId: 7,
};

describe("LOOKUP_ENRICH_CAP (shared)", () => {
  it("is 25", () => {
    expect(LOOKUP_ENRICH_CAP).toBe(25);
  });
});

describe("lookupSeriesWithTmdb", () => {
  it("omits hits without a TVDB id", async () => {
    const lookupByTvdbId = jest.fn(async () => gotArr);
    const getTvExternalIds = jest.fn(async () => ({ tvdbId: undefined }));

    const actual = await lookupSeriesWithTmdb({
      term: "game of thrones",
      tmdb: createPort({
        searchTv: async () => [gotHit],
        getTvExternalIds,
      }),
      lookupByTvdbId,
      lookupByTerm: async () => [],
    });

    expect(getTvExternalIds).toHaveBeenCalledWith(1399);
    expect(lookupByTvdbId).not.toHaveBeenCalled();
    expect(actual).toEqual([]);
  });

  it("omits a hit when getTvExternalIds throws and still enriches siblings", async () => {
    const siblingHit: TmdbMediaHit = {
      tmdbId: 1396,
      title: "Breaking Bad",
      year: 2008,
      posterUrl: undefined,
      overview: "A chemistry teacher turns to crime.",
    };
    const siblingArr: SeriesCandidate = {
      tvdbId: 81189,
      title: "Breaking Bad",
      year: 2008,
      posterUrl: undefined,
      overview: "A chemistry teacher turns to crime.",
      inLibrary: false,
      episodeFileCount: 0,
      episodeCount: 0,
      genres: ["Drama"],
      runtimeMinutes: 47,
      libraryId: undefined,
    };
    const lookupByTerm = jest.fn(async () => []);
    const lookupByTvdbId = jest.fn(async (tvdbId: number) => {
      if (tvdbId === 81189) {
        return siblingArr;
      }
      return null;
    });
    const getTvExternalIds = jest.fn(async (tmdbId: number) => {
      if (tmdbId === 1399) {
        throw new Error("external ids unavailable");
      }
      return { tvdbId: 81189 };
    });

    const actual = await lookupSeriesWithTmdb({
      term: "drama",
      tmdb: createPort({
        searchTv: async () => [gotHit, siblingHit],
        getTvExternalIds,
      }),
      lookupByTvdbId,
      lookupByTerm,
    });

    expect(getTvExternalIds).toHaveBeenCalledWith(1399);
    expect(getTvExternalIds).toHaveBeenCalledWith(1396);
    expect(lookupByTerm).not.toHaveBeenCalled();
    expect(actual).toEqual([siblingArr]);
  });

  it("enriches company discover hits via Arr when TVDB is present", async () => {
    const discoverTvByCompany = jest.fn(async () => [gotHit]);
    const getTvExternalIds = jest.fn(async () => ({ tvdbId: 121361 }));
    const lookupByTvdbId = jest.fn(async () => gotArr);
    const lookupByTerm = jest.fn(async () => []);

    const actual = await lookupSeriesWithTmdb({
      term: "hbo",
      tmdb: createPort({
        searchCompanies: async () => [{ id: 3268, name: "HBO" }],
        discoverTvByCompany,
        getTvExternalIds,
      }),
      lookupByTvdbId,
      lookupByTerm,
    });

    expect(discoverTvByCompany).toHaveBeenCalledWith(3268);
    expect(getTvExternalIds).toHaveBeenCalledWith(1399);
    expect(lookupByTvdbId).toHaveBeenCalledWith(121361);
    expect(lookupByTerm).not.toHaveBeenCalled();
    expect(actual).toEqual([gotArr]);
    expect(actual[0]?.inLibrary).toBe(true);
  });

  it("builds TMDB candidate when Arr returns null", async () => {
    const actual = await lookupSeriesWithTmdb({
      term: "game of thrones",
      tmdb: createPort({
        searchTv: async () => [gotHit],
        getTvExternalIds: async () => ({ tvdbId: 121361 }),
      }),
      lookupByTvdbId: async () => null,
      lookupByTerm: async () => [],
    });

    expect(actual).toEqual([
      {
        tvdbId: 121361,
        title: "Game of Thrones",
        year: 2011,
        posterUrl: undefined,
        overview: "Nine noble families fight for control.",
        inLibrary: false,
        episodeFileCount: 0,
        episodeCount: 0,
        genres: [],
        runtimeMinutes: undefined,
        libraryId: undefined,
      },
    ]);
  });

  it("builds TMDB candidate when Arr enrich throws", async () => {
    const actual = await lookupSeriesWithTmdb({
      term: "game of thrones",
      tmdb: createPort({
        searchTv: async () => [gotHit],
        getTvExternalIds: async () => ({ tvdbId: 121361 }),
      }),
      lookupByTvdbId: async () => {
        throw new Error("sonarr down");
      },
      lookupByTerm: async () => [],
    });

    expect(actual).toHaveLength(1);
    expect(actual[0]?.tvdbId).toBe(121361);
    expect(actual[0]?.inLibrary).toBe(false);
  });

  it("falls back to lookupByTerm when TMDB orchestration throws", async () => {
    const fallback: SeriesCandidate[] = [
      {
        ...gotArr,
        inLibrary: false,
        episodeFileCount: 0,
        episodeCount: 0,
        libraryId: undefined,
      },
    ];
    const lookupByTerm = jest.fn(async () => fallback);

    const actual = await lookupSeriesWithTmdb({
      term: "hbo",
      tmdb: createPort({
        searchCompanies: async () => {
          throw new Error("tmdb unavailable");
        },
      }),
      lookupByTvdbId: async () => null,
      lookupByTerm,
    });

    expect(lookupByTerm).toHaveBeenCalledWith("hbo");
    expect(actual).toEqual(fallback);
  });
});
