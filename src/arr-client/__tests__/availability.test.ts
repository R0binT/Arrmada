import {
    canOfferDownload,
    classifyAvailability,
    classifyEpisode,
    classifyMovie,
    classifySeries,
    isEpisodeOut,
    isMovieOut,
    isSeriesOut,
    seasonNeedsDownload,
} from "../availability";

describe("classifyAvailability", () => {
  it("returns Dispo when the file is present", () => {
    expect(classifyAvailability({ hasFile: true, isOut: false })).toBe("dispo");
    expect(classifyAvailability({ hasFile: true, isOut: true })).toBe("dispo");
  });

  it("returns À venir when not out yet and no file", () => {
    expect(classifyAvailability({ hasFile: false, isOut: false })).toBe(
      "aVenir",
    );
  });

  it("returns À télécharger when out and no file", () => {
    expect(classifyAvailability({ hasFile: false, isOut: true })).toBe(
      "aTelecharger",
    );
  });
});

describe("isMovieOut", () => {
  it("treats released as out", () => {
    expect(isMovieOut("released")).toBe(true);
  });

  it("treats announced and inCinemas as not out yet", () => {
    expect(isMovieOut("announced")).toBe(false);
    expect(isMovieOut("inCinemas")).toBe(false);
  });
});

describe("classifyMovie", () => {
  it("classifies an unreleased followed film as À venir", () => {
    expect(classifyMovie({ hasFile: false, statusSummary: "announced" })).toBe(
      "aVenir",
    );
  });

  it("classifies a released film without a file as À télécharger", () => {
    expect(classifyMovie({ hasFile: false, statusSummary: "released" })).toBe(
      "aTelecharger",
    );
  });

  it("classifies a film with a file as Dispo", () => {
    expect(classifyMovie({ hasFile: true, statusSummary: "released" })).toBe(
      "dispo",
    );
  });
});

describe("isEpisodeOut", () => {
  const now = new Date("2026-07-26T12:00:00.000Z");

  it("is false when air date is missing or in the future", () => {
    expect(isEpisodeOut(undefined, now)).toBe(false);
    expect(isEpisodeOut("2026-08-01T00:00:00Z", now)).toBe(false);
  });

  it("is true when air date is in the past", () => {
    expect(isEpisodeOut("2026-07-01T00:00:00Z", now)).toBe(true);
  });
});

describe("classifyEpisode", () => {
  const now = new Date("2026-07-26T12:00:00.000Z");

  it("classifies a future episode without a file as À venir", () => {
    expect(
      classifyEpisode(
        { hasFile: false, airDateUtc: "2026-08-10T00:00:00Z" },
        now,
      ),
    ).toBe("aVenir");
  });

  it("classifies an aired episode without a file as À télécharger", () => {
    expect(
      classifyEpisode(
        { hasFile: false, airDateUtc: "2026-07-01T00:00:00Z" },
        now,
      ),
    ).toBe("aTelecharger");
  });

  it("classifies an episode with a file as Dispo", () => {
    expect(
      classifyEpisode(
        { hasFile: true, airDateUtc: "2026-08-10T00:00:00Z" },
        now,
      ),
    ).toBe("dispo");
  });
});

describe("isSeriesOut", () => {
  it("treats upcoming as not out", () => {
    expect(isSeriesOut("upcoming", 0)).toBe(false);
    expect(isSeriesOut("upcoming", 5)).toBe(false);
  });

  it("treats continuing/ended as out only when episodes are counted", () => {
    expect(isSeriesOut("continuing", 0)).toBe(false);
    expect(isSeriesOut("continuing", 3)).toBe(true);
    expect(isSeriesOut("ended", 10)).toBe(true);
  });
});

describe("classifySeries", () => {
  it("classifies an upcoming series as À venir", () => {
    expect(
      classifySeries({
        episodeFileCount: 0,
        episodeCount: 0,
        statusSummary: "upcoming",
      }),
    ).toBe("aVenir");
  });

  it("classifies a series with missing episode files as À télécharger", () => {
    expect(
      classifySeries({
        episodeFileCount: 2,
        episodeCount: 5,
        statusSummary: "continuing",
      }),
    ).toBe("aTelecharger");
  });

  it("classifies a series with all episode files as Dispo", () => {
    expect(
      classifySeries({
        episodeFileCount: 5,
        episodeCount: 5,
        statusSummary: "ended",
      }),
    ).toBe("dispo");
  });
});

describe("canOfferDownload", () => {
  it("offers download only for À télécharger", () => {
    expect(canOfferDownload("aTelecharger")).toBe(true);
    expect(canOfferDownload("dispo")).toBe(false);
    expect(canOfferDownload("aVenir")).toBe(false);
  });
});

describe("seasonNeedsDownload", () => {
  it("is true when any episode is À télécharger", () => {
    expect(
      seasonNeedsDownload({
        episodes: [{ availability: "dispo" }, { availability: "aTelecharger" }],
      }),
    ).toBe(true);
  });

  it("is false when every episode is Dispo or À venir", () => {
    expect(
      seasonNeedsDownload({
        episodes: [{ availability: "dispo" }, { availability: "aVenir" }],
      }),
    ).toBe(false);
  });
});
