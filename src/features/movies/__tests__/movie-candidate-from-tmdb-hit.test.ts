import type { TmdbMediaHit } from "@/tmdb-client";

import { movieCandidateFromTmdbHit } from "../movie-candidate-from-tmdb-hit";

describe("movieCandidateFromTmdbHit", () => {
  it("maps TMDB hit fields and sets library defaults", () => {
    const hit: TmdbMediaHit = {
      tmdbId: 1726,
      title: "Iron Man",
      year: 2008,
      posterUrl: "https://image.tmdb.org/t/p/w185/iron.jpg",
      overview: "After being held captive...",
    };

    const actual = movieCandidateFromTmdbHit(hit);

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
