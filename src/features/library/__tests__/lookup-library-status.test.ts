import {
  getMovieLookupLibraryStatus,
  getSeriesLookupLibraryStatus,
} from "@/features/library/lookup-library-status";

describe("lookup-library-status", () => {
  it("movie not in library has no badge", () => {
    expect(
      getMovieLookupLibraryStatus({ inLibrary: false, hasFile: false }),
    ).toEqual({ badge: "none", episodeProgress: undefined });
  });

  it("movie in library without file shows inLibrary", () => {
    expect(
      getMovieLookupLibraryStatus({ inLibrary: true, hasFile: false }),
    ).toEqual({ badge: "inLibrary", episodeProgress: undefined });
  });

  it("movie with file shows alreadyDownloaded", () => {
    expect(
      getMovieLookupLibraryStatus({ inLibrary: true, hasFile: true }),
    ).toEqual({ badge: "alreadyDownloaded", episodeProgress: undefined });
  });

  it("series not in library has no badge or progress", () => {
    expect(
      getSeriesLookupLibraryStatus({
        inLibrary: false,
        episodeFileCount: 0,
        episodeCount: 0,
      }),
    ).toEqual({ badge: "none", episodeProgress: undefined });
  });

  it("series in library with zero counts shows inLibrary without progress", () => {
    expect(
      getSeriesLookupLibraryStatus({
        inLibrary: true,
        episodeFileCount: 0,
        episodeCount: 0,
      }),
    ).toEqual({ badge: "inLibrary", episodeProgress: undefined });
  });

  it("series partial files shows inLibrary and progress", () => {
    expect(
      getSeriesLookupLibraryStatus({
        inLibrary: true,
        episodeFileCount: 12,
        episodeCount: 24,
      }),
    ).toEqual({
      badge: "inLibrary",
      episodeProgress: { have: 12, total: 24 },
    });
  });

  it("series complete files shows alreadyDownloaded and progress", () => {
    expect(
      getSeriesLookupLibraryStatus({
        inLibrary: true,
        episodeFileCount: 24,
        episodeCount: 24,
      }),
    ).toEqual({
      badge: "alreadyDownloaded",
      episodeProgress: { have: 24, total: 24 },
    });
  });
});
