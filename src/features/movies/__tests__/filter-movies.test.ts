import type { Movie } from "@/arr-client";

import { filterMovies } from "../use-movies";

const movie = (overrides: Partial<Movie>): Movie => ({
  id: 1,
  title: "Dune",
  year: 2021,
  posterUrl: undefined,
  monitored: true,
  hasFile: false,
  statusSummary: "released",
  added: undefined,
  overview: "",
  qualityProfileId: undefined,
  fileQuality: undefined,
  sizeOnDisk: undefined,
  genres: [],
  runtimeMinutes: undefined,
  studio: undefined,
  ...overrides,
});

describe("filterMovies", () => {
  const library: readonly Movie[] = [
    movie({
      id: 1,
      title: "Dune",
      monitored: true,
      hasFile: true,
      statusSummary: "released",
    }),
    movie({
      id: 2,
      title: "Dune Part Two",
      monitored: true,
      hasFile: false,
      statusSummary: "released",
    }),
    movie({
      id: 3,
      title: "Avatar 3",
      monitored: true,
      hasFile: false,
      statusSummary: "announced",
    }),
    movie({
      id: 4,
      title: "Old Film",
      monitored: false,
      hasFile: true,
      statusSummary: "released",
    }),
  ];

  it("filters by Suivi", () => {
    expect(filterMovies(library, "suivi", "").map((item) => item.id)).toEqual([
      3, 1, 2,
    ]);
  });

  it("filters by À venir using classifyMovie", () => {
    expect(filterMovies(library, "aVenir", "").map((item) => item.id)).toEqual([
      3,
    ]);
  });

  it("filters by À télécharger using classifyMovie", () => {
    expect(
      filterMovies(library, "aTelecharger", "").map((item) => item.id),
    ).toEqual([2]);
  });

  it("filters by Téléchargé using classifyMovie", () => {
    expect(filterMovies(library, "dispo", "").map((item) => item.id)).toEqual([
      1, 4,
    ]);
  });

  it("applies title search with filters", () => {
    expect(
      filterMovies(library, "dispo", "dune").map((item) => item.id),
    ).toEqual([1]);
  });

  it("sorts titles alphabetically (fr)", () => {
    expect(filterMovies(library, "all", "").map((item) => item.title)).toEqual([
      "Avatar 3",
      "Dune",
      "Dune Part Two",
      "Old Film",
    ]);
  });
});
