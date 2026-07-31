import {
  startMovieDownloadAfterAdd,
  startSeriesDownloadAfterAdd,
} from "../start-download-after-add";

describe("startSeriesDownloadAfterAdd", () => {
  it("starts SeriesSearch for the new series id", async () => {
    const seriesSearch = jest.fn().mockResolvedValue({});
    const actual = await startSeriesDownloadAfterAdd({
      seriesId: 42,
      seriesSearch,
    });

    expect(actual).toEqual({ type: "arrSearchStarted" });
    expect(seriesSearch).toHaveBeenCalledWith(42);
  });
});

describe("startMovieDownloadAfterAdd", () => {
  it("falls back to MoviesSearch when release lookup throws", async () => {
    const moviesSearch = jest.fn().mockResolvedValue({});
    const actual = await startMovieDownloadAfterAdd({
      movieId: 9,
      getMovieReleases: jest.fn().mockRejectedValue(new Error("timeout")),
      moviesSearch,
      grab: jest.fn(),
    });

    expect(actual).toEqual({ type: "arrSearchStarted" });
    expect(moviesSearch).toHaveBeenCalledWith(9);
  });
});
