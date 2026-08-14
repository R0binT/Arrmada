import type { MovieCandidate } from "@/arr-client";
import type { TmdbMediaHit } from "@/tmdb-client";

import { resolveMovieCandidatePreview } from "../resolve-movie-candidate-preview";

const hit: TmdbMediaHit = {
  tmdbId: 1726,
  title: "Iron Man",
  year: 2008,
  posterUrl: "https://image.tmdb.org/t/p/w185/iron.jpg",
  overview: "After being held captive...",
};

describe("resolveMovieCandidatePreview", () => {
  it("returns a TMDB candidate when Arr is unreachable without calling Arr", async () => {
    const lookupByTmdbId = jest.fn(async (): Promise<MovieCandidate | null> => {
      throw new Error("Arr should not be called");
    });
    const getTmdbMovie = jest.fn(async () => hit);

    const actual = await resolveMovieCandidatePreview({
      tmdbId: 1726,
      arrUnreachable: true,
      lookupByTmdbId,
      getTmdbMovie,
    });

    expect(lookupByTmdbId).not.toHaveBeenCalled();
    expect(getTmdbMovie).toHaveBeenCalledWith(1726);
    expect(actual).toEqual({
      tmdbId: 1726,
      title: "Iron Man",
      year: 2008,
      posterUrl: "https://image.tmdb.org/t/p/w185/iron.jpg",
      overview: "After being held captive...",
      inLibrary: false,
      hasFile: false,
      libraryId: undefined,
      genres: [],
      runtimeMinutes: undefined,
    });
  });
});
