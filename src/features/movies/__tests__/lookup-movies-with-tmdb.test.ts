import type { MovieCandidate } from "@/arr-client";
import type { TmdbMediaHit, TmdbNamedMatch, TmdbPagedHits } from "@/tmdb-client";

import {
  lookupMoviesWithTmdb,
  type TmdbMovieSearchPort,
} from "../lookup-movies-with-tmdb";

const emptyNamed = async (): Promise<readonly TmdbNamedMatch[]> => [];
const emptyPaged = async (): Promise<TmdbPagedHits> => ({
  hits: [],
  page: 1,
  totalPages: 1,
});
const emptyParts = async (): Promise<readonly TmdbMediaHit[]> => [];

const paged = (
  hits: readonly TmdbMediaHit[],
  page = 1,
  totalPages = 1,
): TmdbPagedHits => ({ hits, page, totalPages });

const createPort = (
  overrides: Partial<TmdbMovieSearchPort> = {},
): TmdbMovieSearchPort => ({
  searchCompanies: emptyNamed,
  searchKeywords: emptyNamed,
  searchCollections: emptyNamed,
  searchMovies: emptyPaged,
  discoverMoviesByCompany: emptyPaged,
  discoverMoviesByKeyword: emptyPaged,
  getCollectionParts: emptyParts,
  ...overrides,
});

const ironManHit: TmdbMediaHit = {
  tmdbId: 1726,
  title: "Iron Man",
  year: 2008,
  posterUrl: undefined,
  overview: "Tony Stark builds a suit.",
};

const ironManArr: MovieCandidate = {
  tmdbId: 1726,
  title: "Iron Man",
  year: 2008,
  posterUrl: undefined,
  overview: "Tony Stark builds a suit.",
  inLibrary: true,
  hasFile: true,
  libraryId: 42,
  genres: ["Action"],
  runtimeMinutes: 126,
};

describe("lookupMoviesWithTmdb", () => {
  it("enriches company discover hits via Arr when present", async () => {
    const discoverMoviesByCompany = jest.fn(async (_id: number, page = 1) =>
      paged([ironManHit], page, 3),
    );
    const lookupByTmdbId = jest.fn(async () => ironManArr);
    const lookupByTerm = jest.fn(async () => []);

    const actual = await lookupMoviesWithTmdb({
      term: "marvel",
      tmdb: createPort({
        searchCompanies: async () => [
          { id: 420, name: "Marvel Studios" },
        ],
        discoverMoviesByCompany,
      }),
      lookupByTmdbId,
      lookupByTerm,
    });

    expect(discoverMoviesByCompany).toHaveBeenCalledWith(420, 1);
    expect(lookupByTmdbId).toHaveBeenCalledWith(1726);
    expect(lookupByTerm).not.toHaveBeenCalled();
    expect(actual.items).toEqual([ironManArr]);
    expect(actual.hasMore).toBe(true);
    expect(actual.totalPages).toBe(3);
  });

  it("requests the given discover page for load-more", async () => {
    const page2Hit: TmdbMediaHit = {
      ...ironManHit,
      tmdbId: 10138,
      title: "Iron Man 2",
    };
    const discoverMoviesByCompany = jest.fn(async (_id: number, page = 1) =>
      page === 2 ? paged([page2Hit], 2, 3) : paged([ironManHit], 1, 3),
    );

    const actual = await lookupMoviesWithTmdb({
      term: "marvel",
      page: 2,
      tmdb: createPort({
        searchCompanies: async () => [{ id: 420, name: "Marvel Studios" }],
        discoverMoviesByCompany,
      }),
      lookupByTmdbId: async () => null,
      lookupByTerm: async () => [],
    });

    expect(discoverMoviesByCompany).toHaveBeenCalledWith(420, 2);
    expect(actual.items.map((item) => item.tmdbId)).toEqual([10138]);
    expect(actual.page).toBe(2);
    expect(actual.hasMore).toBe(true);
  });

  it("falls back to TMDB candidate when Arr returns null", async () => {
    const actual = await lookupMoviesWithTmdb({
      term: "iron man",
      tmdb: createPort({
        searchMovies: async () => paged([ironManHit]),
      }),
      lookupByTmdbId: async () => null,
      lookupByTerm: async () => [],
    });

    expect(actual.items).toEqual([
      {
        tmdbId: 1726,
        title: "Iron Man",
        year: 2008,
        posterUrl: undefined,
        overview: "Tony Stark builds a suit.",
        inLibrary: false,
        hasFile: false,
        libraryId: undefined,
        genres: [],
        runtimeMinutes: undefined,
      },
    ]);
    expect(actual.hasMore).toBe(false);
  });

  it("keeps TMDB row when Arr enricher throws", async () => {
    const actual = await lookupMoviesWithTmdb({
      term: "iron man",
      tmdb: createPort({
        searchMovies: async () => paged([ironManHit]),
      }),
      lookupByTmdbId: async () => {
        throw new Error("radarr down");
      },
      lookupByTerm: async () => [],
    });

    expect(actual.items).toHaveLength(1);
    expect(actual.items[0]?.tmdbId).toBe(1726);
    expect(actual.items[0]?.inLibrary).toBe(false);
  });

  it("falls back to lookupByTerm when TMDB orchestration throws", async () => {
    const fallback: MovieCandidate[] = [
      {
        ...ironManArr,
        inLibrary: false,
        hasFile: false,
        libraryId: undefined,
      },
    ];
    const lookupByTerm = jest.fn(async () => fallback);

    const actual = await lookupMoviesWithTmdb({
      term: "marvel",
      tmdb: createPort({
        searchCompanies: async () => {
          throw new Error("tmdb unavailable");
        },
      }),
      lookupByTmdbId: async () => null,
      lookupByTerm,
    });

    expect(lookupByTerm).toHaveBeenCalledWith("marvel");
    expect(actual.items).toEqual(fallback);
    expect(actual.hasMore).toBe(false);
  });
});
