import {
  mapMovieResult,
  mapNamedMatch,
  mapTvExternalIds,
  mapTvResult,
} from "../mappers";

describe("tmdb mappers", () => {
  it("maps movie result to TmdbMediaHit", () => {
    const actual = mapMovieResult({
      id: 1726,
      title: "Iron Man",
      release_date: "2008-05-02",
      poster_path: "/78lPtwv72eTNqFW9COBYZF4Bs9q.jpg",
      overview: "After being held captive...",
    });

    expect(actual).toEqual({
      tmdbId: 1726,
      title: "Iron Man",
      year: 2008,
      posterUrl: "https://image.tmdb.org/t/p/w185/78lPtwv72eTNqFW9COBYZF4Bs9q.jpg",
      overview: "After being held captive...",
    });
  });

  it("maps tv result to TmdbMediaHit", () => {
    const actual = mapTvResult({
      id: 1399,
      name: "Game of Thrones",
      first_air_date: "2011-04-17",
      poster_path: "/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg",
      overview: "Seven noble families...",
    });

    expect(actual).toEqual({
      tmdbId: 1399,
      title: "Game of Thrones",
      year: 2011,
      posterUrl: "https://image.tmdb.org/t/p/w185/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg",
      overview: "Seven noble families...",
    });
  });

  it("uses empty overview and undefined poster when missing", () => {
    const actual = mapMovieResult({
      id: 1,
      title: "Untitled",
      release_date: "2020-01-01",
      poster_path: null,
      overview: null,
    });

    expect(actual.overview).toBe("");
    expect(actual.posterUrl).toBeUndefined();
  });

  it("maps named match id and name", () => {
    expect(mapNamedMatch({ id: 420, name: "Marvel Studios" })).toEqual({
      id: 420,
      name: "Marvel Studios",
    });
  });

  it("maps tv external ids tvdb_id", () => {
    expect(mapTvExternalIds({ tvdb_id: 121361 })).toEqual({ tvdbId: 121361 });
    expect(mapTvExternalIds({ tvdb_id: null })).toEqual({
      tvdbId: undefined,
    });
  });
});
