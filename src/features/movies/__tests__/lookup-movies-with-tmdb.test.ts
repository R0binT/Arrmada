import type { MovieCandidate } from "@/arr-client";
import type { TmdbMediaHit, TmdbNamedMatch } from "@/tmdb-client";

import {
  LOOKUP_ENRICH_CAP,
  lookupMoviesWithTmdb,
  type TmdbMovieSearchPort,
} from "../lookup-movies-with-tmdb";

const emptyNamed = async (): Promise<TmdbNamedMatch[]> => [];
const emptyHits = async (): Promise<TmdbMediaHit[]> => [];

const createPort = (
  overrides: Partial<TmdbMovieSearchPort> = {},
): TmdbMovieSearchPort => ({
  searchCompanies: emptyNamed,
  searchKeywords: emptyNamed,
  searchCollections: emptyNamed,
  searchMovies: emptyHits,
  discoverMoviesByCompany: emptyHits,
  discoverMoviesByKeyword: emptyHits,
  getCollectionParts: emptyHits,
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

describe("LOOKUP_ENRICH_CAP", () => {
  it("is 25", () => {
    expect(LOOKUP_ENRICH_CAP).toBe(25);
  });
});

describe("lookupMoviesWithTmdb", () => {
  it("enriches company discover hits via Arr when present", async () => {
    const discoverMoviesByCompany = jest.fn(async () => [ironManHit]);
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

    expect(discoverMoviesByCompany).toHaveBeenCalledWith(420);
    expect(lookupByTmdbId).toHaveBeenCalledWith(1726);
    expect(lookupByTerm).not.toHaveBeenCalled();
    expect(actual).toEqual([ironManArr]);
    expect(actual[0]?.inLibrary).toBe(true);
  });

  it("falls back to TMDB candidate when Arr returns null", async () => {
    const actual = await lookupMoviesWithTmdb({
      term: "iron man",
      tmdb: createPort({
        searchMovies: async () => [ironManHit],
      }),
      lookupByTmdbId: async () => null,
      lookupByTerm: async () => [],
    });

    expect(actual).toEqual([
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
  });

  it("keeps TMDB row when Arr enrich throws", async () => {
    const actual = await lookupMoviesWithTmdb({
      term: "iron man",
      tmdb: createPort({
        searchMovies: async () => [ironManHit],
      }),
      lookupByTmdbId: async () => {
        throw new Error("radarr down");
      },
      lookupByTerm: async () => [],
    });

    expect(actual).toHaveLength(1);
    expect(actual[0]?.tmdbId).toBe(1726);
    expect(actual[0]?.inLibrary).toBe(false);
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
    expect(actual).toEqual(fallback);
  });
});
