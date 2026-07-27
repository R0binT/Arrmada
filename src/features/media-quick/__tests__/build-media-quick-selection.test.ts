import type { Episode, Movie, Series, UpcomingItem } from "@/arr-client";

import {
  seasonAvailability,
  selectionFromMovie,
  selectionFromSeries,
  selectionFromUpcoming,
} from "../build-media-quick-selection";
import { buildMediaQuickViewModel } from "../build-media-quick-view-model";

const chipLabels = (
  chips: readonly { readonly label: string }[],
): string[] => chips.map((chip) => chip.label);

const movie = (overrides: Partial<Movie> = {}): Movie => ({
  id: 1,
  title: "Night Harbor",
  year: 2024,
  posterUrl: undefined,
  monitored: true,
  hasFile: true,
  statusSummary: "released",
  added: "2026-01-10T12:00:00Z",
  overview: "",
  qualityProfileId: undefined,
  fileQuality: "Bluray-1080p",
  sizeOnDisk: 8_000_000_000,
  genres: ["Thriller", "Drama"],
  runtimeMinutes: 118,
  studio: "A24",
  ...overrides,
});

const series = (overrides: Partial<Series> = {}): Series => ({
  id: 3,
  title: "Night Harbor",
  year: 2022,
  posterUrl: undefined,
  monitored: true,
  episodeFileCount: 20,
  episodeCount: 20,
  statusSummary: "ended",
  added: "2026-01-10T12:00:00Z",
  overview: "",
  qualityProfileId: undefined,
  genres: ["Crime"],
  runtimeMinutes: 45,
  network: "HBO",
  ...overrides,
});

describe("build-media-quick-selection", () => {
  it("builds the same movie selection for home and library", () => {
    const selection = selectionFromMovie(movie());
    const vm = buildMediaQuickViewModel(selection);
    expect(chipLabels(vm.chips)).toEqual(
      expect.arrayContaining(["Thriller", "Drama", "1 h 58 min", "A24"]),
    );
    expect(vm.detailLine).toMatch(/Bluray-1080p/);
  });

  it("builds the same series selection for home and library", () => {
    const selection = selectionFromSeries(series());
    const vm = buildMediaQuickViewModel(selection);
    expect(chipLabels(vm.chips)).toEqual(
      expect.arrayContaining(["20/20 épisodes", "Crime", "HBO", "45 min"]),
    );
  });

  it("enriches upcoming movie from library", () => {
    const upcoming: UpcomingItem = {
      kind: "movie",
      id: 1,
      title: "Night Harbor",
      subtitle: undefined,
      date: "2026-08-01T20:00:00Z",
      posterUrl: undefined,
    };
    const selection = selectionFromUpcoming(upcoming, { movies: [movie()] });
    const vm = buildMediaQuickViewModel(selection);
    expect(vm.statusLine).toBe("À venir");
    expect(chipLabels(vm.chips)).toEqual(
      expect.arrayContaining(["Thriller", "Drama", "A24"]),
    );
    expect(vm.detailLine).toMatch(/Sortie/i);
  });

  it("enriches upcoming episode from series library", () => {
    const upcoming: UpcomingItem = {
      kind: "episode",
      id: 99,
      seriesId: 3,
      seriesTitle: "Night Harbor",
      episodeTitle: "Pilot",
      seasonNumber: 1,
      episodeNumber: 1,
      title: "Night Harbor - S01E01",
      subtitle: undefined,
      date: "2026-07-26T20:00:00Z",
      posterUrl: undefined,
    };
    const selection = selectionFromUpcoming(upcoming, { series: [series()] });
    const vm = buildMediaQuickViewModel(selection);
    expect(vm.title).toBe("Pilot");
    expect(vm.subtitle).toBe("Night Harbor");
    expect(chipLabels(vm.chips)[0]).toMatch(/S01E01/);
    expect(chipLabels(vm.chips)).toEqual(
      expect.arrayContaining(["Crime", "HBO", "45 min"]),
    );
  });
});

describe("seasonAvailability", () => {
  const episode = (
    overrides: Partial<Episode> & Pick<Episode, "availability">,
  ): Episode => ({
    id: 1,
    seasonNumber: 1,
    episodeNumber: 1,
    title: "Ep",
    airDateUtc: undefined,
    hasFile: overrides.availability === "dispo",
    monitored: true,
    ...overrides,
  });

  it("returns Téléchargé when every episode is on disk", () => {
    expect(
      seasonAvailability({
        seasonNumber: 1,
        episodes: [
          episode({ id: 1, availability: "dispo" }),
          episode({ id: 2, episodeNumber: 2, availability: "dispo" }),
        ],
      }),
    ).toBe("dispo");
  });

  it("prefers À télécharger when any aired episode is missing", () => {
    expect(
      seasonAvailability({
        seasonNumber: 1,
        episodes: [
          episode({ id: 1, availability: "dispo" }),
          episode({ id: 2, episodeNumber: 2, availability: "aTelecharger" }),
          episode({ id: 3, episodeNumber: 3, availability: "aVenir" }),
        ],
      }),
    ).toBe("aTelecharger");
  });

  it("returns À venir only when the whole season is upcoming", () => {
    expect(
      seasonAvailability({
        seasonNumber: 1,
        episodes: [
          episode({ id: 1, availability: "aVenir" }),
          episode({ id: 2, episodeNumber: 2, availability: "aVenir" }),
        ],
      }),
    ).toBe("aVenir");
  });

  it("omits status for mixed downloaded + upcoming seasons", () => {
    expect(
      seasonAvailability({
        seasonNumber: 1,
        episodes: [
          episode({ id: 1, availability: "dispo" }),
          episode({ id: 2, episodeNumber: 2, availability: "aVenir" }),
        ],
      }),
    ).toBeUndefined();
  });
});
