import type { Series } from "@/arr-client";

import { filterSeries } from "../use-series";

const series = (overrides: Partial<Series>): Series => ({
  id: 1,
  title: "Foundation",
  year: 2021,
  posterUrl: undefined,
  monitored: true,
  episodeFileCount: 0,
  episodeCount: 0,
  statusSummary: "upcoming",
  added: undefined,
  overview: "",
  qualityProfileId: undefined,
  genres: [],
  runtimeMinutes: undefined,
  network: undefined,
  ...overrides,
});

describe("filterSeries", () => {
  const library: readonly Series[] = [
    series({
      id: 1,
      title: "Foundation",
      monitored: true,
      episodeFileCount: 10,
      episodeCount: 10,
      statusSummary: "ended",
    }),
    series({
      id: 2,
      title: "The Expanse",
      monitored: true,
      episodeFileCount: 4,
      episodeCount: 10,
      statusSummary: "continuing",
    }),
    series({
      id: 3,
      title: "Upcoming Show",
      monitored: true,
      episodeFileCount: 0,
      episodeCount: 0,
      statusSummary: "upcoming",
    }),
    series({
      id: 4,
      title: "Archived",
      monitored: false,
      episodeFileCount: 8,
      episodeCount: 8,
      statusSummary: "ended",
    }),
  ];

  it("filters by Suivi", () => {
    expect(filterSeries(library, "suivi", "").map((item) => item.id)).toEqual([
      1, 2, 3,
    ]);
  });

  it("filters by À venir using classifySeries", () => {
    expect(filterSeries(library, "aVenir", "").map((item) => item.id)).toEqual([
      3,
    ]);
  });

  it("filters by À télécharger using classifySeries", () => {
    expect(
      filterSeries(library, "aTelecharger", "").map((item) => item.id),
    ).toEqual([2]);
  });

  it("filters by Téléchargé using classifySeries", () => {
    expect(filterSeries(library, "dispo", "").map((item) => item.id)).toEqual([
      4, 1,
    ]);
  });

  it("applies title search with filters", () => {
    expect(
      filterSeries(library, "dispo", "found").map((item) => item.id),
    ).toEqual([1]);
  });

  it("sorts titles alphabetically (fr)", () => {
    expect(filterSeries(library, "all", "").map((item) => item.title)).toEqual([
      "Archived",
      "Foundation",
      "The Expanse",
      "Upcoming Show",
    ]);
  });
});
