import type { CalendarEpisode, CalendarMovie } from "../types";
import {
    buildCalendarEvents,
    buildUpcomingItems,
    calendarRangeForMonth,
    defaultCalendarRange,
    mergeCalendarRanges,
} from "../upcoming";

describe("buildUpcomingItems", () => {
  const now = new Date("2026-07-01T12:00:00.000Z");

  const announcedMovie: CalendarMovie = {
    id: 1,
    title: "Harbor",
    year: 2026,
    posterUrl: undefined,
    hasFile: false,
    statusSummary: "announced",
    releaseDate: "2026-08-10T00:00:00Z",
  };

  const releasedMovie: CalendarMovie = {
    id: 2,
    title: "Old Film",
    year: 2024,
    posterUrl: undefined,
    hasFile: false,
    statusSummary: "released",
    releaseDate: "2024-01-01T00:00:00Z",
  };

  const futureEpisode: CalendarEpisode = {
    id: 10,
    seriesId: 5,
    seriesTitle: "Lakeside",
    episodeTitle: "Pilot",
    seasonNumber: 1,
    episodeNumber: 1,
    posterUrl: undefined,
    hasFile: false,
    airDateUtc: "2026-07-15T20:00:00Z",
  };

  const airedEpisode: CalendarEpisode = {
    id: 11,
    seriesId: 5,
    seriesTitle: "Lakeside",
    episodeTitle: "Past",
    seasonNumber: 1,
    episodeNumber: 0,
    posterUrl: undefined,
    hasFile: false,
    airDateUtc: "2026-06-01T20:00:00Z",
  };

  it("keeps only À venir films and episodes, sorted by date", () => {
    const actual = buildUpcomingItems({
      movies: [releasedMovie, announcedMovie],
      episodes: [airedEpisode, futureEpisode],
      now,
    });

    expect(actual).toHaveLength(2);
    expect(actual[0]).toMatchObject({
      kind: "episode",
      id: 10,
      seriesId: 5,
      title: "S01E01 · Pilot",
      subtitle: "Lakeside",
    });
    expect(actual[1]).toMatchObject({
      kind: "movie",
      id: 1,
      title: "Harbor",
      subtitle: "2026",
    });
  });

  it("keeps one tile per upcoming episode of the same series", () => {
    const second: CalendarEpisode = {
      ...futureEpisode,
      id: 12,
      episodeNumber: 2,
      episodeTitle: "Fog",
      airDateUtc: "2026-07-22T20:00:00Z",
    };
    const actual = buildUpcomingItems({
      movies: [],
      episodes: [futureEpisode, second],
      now,
    });
    expect(actual).toHaveLength(2);
    expect(actual.map((item) => item.title)).toEqual([
      "S01E01 · Pilot",
      "S01E02 · Fog",
    ]);
  });

  it("drops episodes without an air date", () => {
    const actual = buildUpcomingItems({
      movies: [],
      episodes: [{ ...futureEpisode, airDateUtc: undefined }],
      now,
    });
    expect(actual).toEqual([]);
  });

  it("drops incomplete episode rows without series title or poster", () => {
    const actual = buildUpcomingItems({
      movies: [{ ...announcedMovie, title: "  " }],
      episodes: [{ ...futureEpisode, seriesTitle: "", posterUrl: undefined }],
      now,
    });
    expect(actual).toEqual([]);
  });
});

describe("buildCalendarEvents", () => {
  const now = new Date("2026-07-01T12:00:00.000Z");

  it("keeps Dispo, À télécharger and À venir rows", () => {
    const actual = buildCalendarEvents({
      movies: [
        {
          id: 1,
          title: "Harbor",
          year: 2026,
          posterUrl: undefined,
          hasFile: false,
          statusSummary: "announced",
          releaseDate: "2026-08-10T00:00:00Z",
        },
        {
          id: 2,
          title: "Ready",
          year: 2024,
          posterUrl: undefined,
          hasFile: true,
          statusSummary: "released",
          releaseDate: "2024-01-01T00:00:00Z",
        },
        {
          id: 3,
          title: "Missing",
          year: 2025,
          posterUrl: undefined,
          hasFile: false,
          statusSummary: "released",
          releaseDate: "2025-06-01T00:00:00Z",
        },
      ],
      episodes: [
        {
          id: 10,
          seriesId: 5,
          seriesTitle: "Lakeside",
          episodeTitle: "Pilot",
          seasonNumber: 1,
          episodeNumber: 1,
          posterUrl: undefined,
          hasFile: false,
          airDateUtc: "2026-07-15T20:00:00Z",
        },
      ],
      now,
    });

    expect(actual).toHaveLength(4);
    expect(
      actual.find((item) => item.id === 2 && item.kind === "movie"),
    ).toMatchObject({
      availability: "dispo",
    });
    expect(
      actual.find((item) => item.id === 3 && item.kind === "movie"),
    ).toMatchObject({
      availability: "aTelecharger",
    });
    expect(
      actual.find((item) => item.id === 1 && item.kind === "movie"),
    ).toMatchObject({
      availability: "aVenir",
    });
    expect(
      actual.find((item) => item.id === 10 && item.kind === "episode"),
    ).toMatchObject({
      availability: "aVenir",
    });
  });
});

describe("defaultCalendarRange", () => {
  it("returns a long horizon from UTC today for the list", () => {
    const range = defaultCalendarRange(new Date("2026-07-01T15:30:00.000Z"));
    expect(range.start).toBe("2026-07-01");
    expect(range.end).toBe("2036-06-28");
  });
});

describe("calendarRangeForMonth", () => {
  it("returns local month bounds expanded by 7 days", () => {
    const range = calendarRangeForMonth(new Date(2026, 6, 1));
    expect(range.start).toBe("2026-06-24");
    expect(range.end).toBe("2026-08-07");
  });
});

describe("mergeCalendarRanges", () => {
  it("takes the widest start/end window", () => {
    expect(
      mergeCalendarRanges(
        { start: "2026-07-01", end: "2036-06-28" },
        { start: "2026-06-24", end: "2026-08-07" },
      ),
    ).toEqual({ start: "2026-06-24", end: "2036-06-28" });
  });
});
