import type { SeriesCandidate } from "@/arr-client";
import type { TmdbMediaHit, TmdbNamedMatch, TmdbPagedHits } from "@/tmdb-client";

import {
  lookupSeriesWithTmdb,
  type TmdbSeriesSearchPort,
} from "../lookup-series-with-tmdb";

const emptyNamed = async (): Promise<readonly TmdbNamedMatch[]> => [];
const emptyPaged = async (): Promise<TmdbPagedHits> => ({
  hits: [],
  page: 1,
  totalPages: 1,
});

const paged = (
  hits: readonly TmdbMediaHit[],
  page = 1,
  totalPages = 1,
): TmdbPagedHits => ({ hits, page, totalPages });

const createPort = (
  overrides: Partial<TmdbSeriesSearchPort> = {},
): TmdbSeriesSearchPort => ({
  searchCompanies: emptyNamed,
  searchKeywords: emptyNamed,
  searchTv: emptyPaged,
  discoverTvByCompany: emptyPaged,
  discoverTvByKeyword: emptyPaged,
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

describe("lookupSeriesWithTmdb", () => {
  it("omits hits without a TVDB id", async () => {
    const lookupByTvdbId = jest.fn(async () => gotArr);
    const getTvExternalIds = jest.fn(async () => ({ tvdbId: undefined }));

    const actual = await lookupSeriesWithTmdb({
      term: "game of thrones",
      tmdb: createPort({
        searchTv: async () => paged([gotHit]),
        getTvExternalIds,
      }),
      lookupByTvdbId,
      lookupByTerm: async () => [],
    });

    expect(getTvExternalIds).toHaveBeenCalledWith(1399);
    expect(lookupByTvdbId).not.toHaveBeenCalled();
    expect(actual.items).toEqual([]);
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
        searchTv: async () => paged([gotHit, siblingHit]),
        getTvExternalIds,
      }),
      lookupByTvdbId,
      lookupByTerm,
    });

    expect(getTvExternalIds).toHaveBeenCalledWith(1399);
    expect(getTvExternalIds).toHaveBeenCalledWith(1396);
    expect(lookupByTerm).not.toHaveBeenCalled();
    expect(actual.items).toEqual([siblingArr]);
  });

  it("enriches company discover hits via Arr when TVDB is present", async () => {
    const discoverTvByCompany = jest.fn(async (_id: number, page = 1) =>
      paged([gotHit], page, 2),
    );
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

    expect(discoverTvByCompany).toHaveBeenCalledWith(3268, 1);
    expect(getTvExternalIds).toHaveBeenCalledWith(1399);
    expect(lookupByTvdbId).toHaveBeenCalledWith(121361);
    expect(lookupByTerm).not.toHaveBeenCalled();
    expect(actual.items).toEqual([gotArr]);
    expect(actual.hasMore).toBe(true);
  });

  it("requests the given discover page for load-more", async () => {
    const page2Hit: TmdbMediaHit = {
      ...gotHit,
      tmdbId: 66732,
      title: "Stranger Things",
    };
    const discoverTvByCompany = jest.fn(async (_id: number, page = 1) =>
      page === 2 ? paged([page2Hit], 2, 2) : paged([gotHit], 1, 2),
    );

    const actual = await lookupSeriesWithTmdb({
      term: "hbo",
      page: 2,
      tmdb: createPort({
        searchCompanies: async () => [{ id: 3268, name: "HBO" }],
        discoverTvByCompany,
        getTvExternalIds: async () => ({ tvdbId: 305288 }),
      }),
      lookupByTvdbId: async () => null,
      lookupByTerm: async () => [],
    });

    expect(discoverTvByCompany).toHaveBeenCalledWith(3268, 2);
    expect(actual.items.map((item) => item.title)).toEqual(["Stranger Things"]);
    expect(actual.items[0]?.tvdbId).toBe(305288);
    expect(actual.page).toBe(2);
    expect(actual.hasMore).toBe(false);
  });

  it("builds TMDB candidate when Arr returns null", async () => {
    const actual = await lookupSeriesWithTmdb({
      term: "game of thrones",
      tmdb: createPort({
        searchTv: async () => paged([gotHit]),
        getTvExternalIds: async () => ({ tvdbId: 121361 }),
      }),
      lookupByTvdbId: async () => null,
      lookupByTerm: async () => [],
    });

    expect(actual.items).toEqual([
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
        searchTv: async () => paged([gotHit]),
        getTvExternalIds: async () => ({ tvdbId: 121361 }),
      }),
      lookupByTvdbId: async () => {
        throw new Error("sonarr down");
      },
      lookupByTerm: async () => [],
    });

    expect(actual.items).toHaveLength(1);
    expect(actual.items[0]?.tvdbId).toBe(121361);
    expect(actual.items[0]?.inLibrary).toBe(false);
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
    expect(actual.items).toEqual(fallback);
    expect(actual.hasMore).toBe(false);
  });
});
