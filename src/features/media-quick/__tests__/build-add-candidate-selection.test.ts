import {
  buildMovieAddSelection,
  buildSeriesAddSelection,
} from "@/features/media-quick/build-add-candidate-selection";
import { t } from "@/i18n";

describe("build-add-candidate-selection", () => {
  it("maps movie candidate genres and downloaded status", () => {
    const actual = buildMovieAddSelection({
      tmdbId: 1,
      title: "Night Harbor",
      year: 2024,
      posterUrl: undefined,
      inLibrary: true,
      hasFile: true,
      overview: "x",
      genres: ["Drama", "Mystery"],
      runtimeMinutes: 118,
      libraryId: 9,
    });
    expect(actual.kind).toBe("movie");
    expect(actual.key).toBe("movie-add:1");
    expect(actual.movieId).toBe(9);
    expect(actual.genres).toEqual(["Drama", "Mystery"]);
    expect(actual.runtimeMinutes).toBe(118);
    expect(actual.glanceStatusLine).toBe(t("add.alreadyDownloaded"));
    expect(actual.glanceStatusTone).toBe("success");
    expect(actual).not.toHaveProperty("overview");
  });

  it("omits movieId when not in library", () => {
    const actual = buildMovieAddSelection({
      tmdbId: 2,
      title: "New",
      year: 2025,
      posterUrl: undefined,
      inLibrary: false,
      hasFile: false,
      overview: "",
      genres: [],
      runtimeMinutes: undefined,
      libraryId: undefined,
    });
    expect(actual.movieId).toBeUndefined();
    expect(actual.glanceStatusLine).toBeUndefined();
    expect(actual.glanceStatusTone).toBeUndefined();
  });

  it("maps movie in-library without file to muted tone", () => {
    const actual = buildMovieAddSelection({
      tmdbId: 3,
      title: "Queued",
      year: 2023,
      posterUrl: undefined,
      inLibrary: true,
      hasFile: false,
      overview: "",
      genres: ["Action"],
      runtimeMinutes: 90,
      libraryId: 11,
    });
    expect(actual.movieId).toBe(11);
    expect(actual.glanceStatusLine).toBe(t("add.inLibrary"));
    expect(actual.glanceStatusTone).toBe("muted");
  });

  it("maps series candidate genres and downloaded status", () => {
    const actual = buildSeriesAddSelection({
      tvdbId: 100,
      title: "Harbor Nights",
      year: 2021,
      posterUrl: undefined,
      inLibrary: true,
      episodeFileCount: 10,
      episodeCount: 10,
      overview: "x",
      genres: ["Drama", "Crime"],
      runtimeMinutes: 45,
      libraryId: 7,
    });
    expect(actual.kind).toBe("series");
    expect(actual.key).toBe("series-add:100");
    expect(actual.seriesId).toBe(7);
    expect(actual.genres).toEqual(["Drama", "Crime"]);
    expect(actual.runtimeMinutes).toBe(45);
    expect(actual.glanceStatusLine).toBe(t("add.alreadyDownloaded"));
    expect(actual.glanceStatusTone).toBe("success");
    expect(actual).not.toHaveProperty("overview");
  });

  it("omits seriesId when not in library", () => {
    const actual = buildSeriesAddSelection({
      tvdbId: 200,
      title: "Fresh",
      year: 2026,
      posterUrl: undefined,
      inLibrary: false,
      episodeFileCount: 0,
      episodeCount: 0,
      overview: "",
      genres: [],
      runtimeMinutes: undefined,
      libraryId: undefined,
    });
    expect(actual.seriesId).toBeUndefined();
    expect(actual.glanceStatusLine).toBeUndefined();
    expect(actual.glanceStatusTone).toBeUndefined();
  });

  it("maps series partial files to muted in-library status", () => {
    const actual = buildSeriesAddSelection({
      tvdbId: 300,
      title: "Partial",
      year: 2020,
      posterUrl: undefined,
      inLibrary: true,
      episodeFileCount: 3,
      episodeCount: 8,
      overview: "",
      genres: ["Sci-Fi"],
      runtimeMinutes: 50,
      libraryId: 15,
    });
    expect(actual.seriesId).toBe(15);
    expect(actual.glanceStatusLine).toBe(t("add.inLibrary"));
    expect(actual.glanceStatusTone).toBe("muted");
  });
});
