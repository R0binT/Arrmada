import { mapHealth } from "../mappers/health";
import { mapMovieCandidate, mapRadarrMovie } from "../mappers/movie";
import { mapRadarrCredits, mapTvMazeCast } from "../mappers/cast";
import { formatCrewLine } from "../mappers/crew-line";
import { mapRatings, formatRatingLabel } from "../mappers/ratings";
import { setI18nLocale } from "@/i18n";
import { computeProgress, mapQueueItem } from "../mappers/queue";
import {
    groupEpisodesIntoSeasons,
    mapSeriesCandidate,
    mapSonarrEpisode,
    mapSonarrSeries,
} from "../mappers/series";

describe("mappers", () => {
  it("maps radarr movie poster to absolute URL", () => {
    const actual = mapRadarrMovie(
      {
        id: 1,
        title: "Night Harbor",
        year: 2024,
        monitored: true,
        hasFile: false,
        status: "released",
        overview: "A foggy pier.",
        qualityProfileId: 4,
        images: [{ coverType: "poster", remoteUrl: "https://cdn/p.jpg" }],
      },
      "http://192.168.1.10:7878",
    );
    expect(actual).toEqual({
      id: 1,
      title: "Night Harbor",
      year: 2024,
      posterUrl: "https://cdn/p.jpg",
      monitored: true,
      hasFile: false,
      statusSummary: "released",
      added: undefined,
      overview: "A foggy pier.",
      qualityProfileId: 4,
      fileQuality: undefined,
      sizeOnDisk: undefined,
      genres: [],
      runtimeMinutes: undefined,
      studio: undefined,
      ratings: [],
      certification: undefined,
      originalLanguage: undefined,
      inCinemas: undefined,
      digitalRelease: undefined,
      physicalRelease: undefined,
      collectionTitle: undefined,
      externalIds: {
        imdbId: undefined,
        tmdbId: undefined,
        tvdbId: undefined,
        tvMazeId: undefined,
      },
    });
  });

  it("maps radarr movie file quality, size, genres, runtime, studio when present", () => {
    const actual = mapRadarrMovie(
      {
        id: 1,
        title: "Night Harbor",
        year: 2024,
        monitored: true,
        hasFile: true,
        status: "released",
        overview: "A foggy pier.",
        qualityProfileId: 4,
        sizeOnDisk: 1_500_000_000,
        runtime: 118,
        studio: "Harbor Films",
        genres: ["Drama", "Mystery"],
        movieFile: {
          quality: { quality: { name: "Bluray-1080p" } },
        },
        images: [{ coverType: "poster", remoteUrl: "https://cdn/p.jpg" }],
      },
      "http://192.168.1.10:7878",
    );
    expect(actual.fileQuality).toBe("Bluray-1080p");
    expect(actual.sizeOnDisk).toBe(1_500_000_000);
    expect(actual.runtimeMinutes).toBe(118);
    expect(actual.studio).toBe("Harbor Films");
    expect(actual.genres).toEqual(["Drama", "Mystery"]);
  });

  it("maps movie candidate without raw payload", () => {
    const actual = mapMovieCandidate(
      {
        tmdbId: 99,
        title: "Night Harbor",
        year: 2024,
        images: [{ coverType: "poster", remoteUrl: "https://cdn/p.jpg" }],
        overview: "secret",
      },
      "http://192.168.1.10:7878",
    );
    expect(actual).toEqual({
      tmdbId: 99,
      title: "Night Harbor",
      year: 2024,
      posterUrl: "https://cdn/p.jpg",
      inLibrary: false,
      hasFile: false,
      overview: "secret",
      genres: [],
      runtimeMinutes: undefined,
      libraryId: undefined,
    });
  });

  it("maps movie candidate in library with file from lookup id and hasFile", () => {
    const actual = mapMovieCandidate(
      {
        id: 42,
        tmdbId: 99,
        title: "Night Harbor",
        year: 2024,
        hasFile: true,
        images: [],
      },
      "http://192.168.1.10:7878",
    );
    expect(actual).toEqual({
      tmdbId: 99,
      title: "Night Harbor",
      year: 2024,
      posterUrl: undefined,
      inLibrary: true,
      hasFile: true,
      overview: "",
      genres: [],
      runtimeMinutes: undefined,
      libraryId: 42,
    });
  });

  it("maps movie candidate id 0 as not in library", () => {
    const actual = mapMovieCandidate(
      {
        id: 0,
        tmdbId: 7,
        title: "New Title",
        year: 2025,
        hasFile: false,
        images: [],
      },
      "http://192.168.1.10:7878",
    );
    expect(actual?.inLibrary).toBe(false);
    expect(actual?.hasFile).toBe(false);
    expect(actual).toMatchObject({
      overview: "",
      genres: [],
      runtimeMinutes: undefined,
      libraryId: undefined,
    });
  });

  it("maps movie candidate overview genres runtime and libraryId", () => {
    const actual = mapMovieCandidate(
      {
        id: 42,
        tmdbId: 99,
        title: "Night Harbor",
        year: 2024,
        hasFile: true,
        overview: "Dockside noir.",
        genres: ["Drama"],
        runtime: 118,
        images: [],
      },
      "http://192.168.1.10:7878",
    );
    expect(actual).toMatchObject({
      tmdbId: 99,
      inLibrary: true,
      hasFile: true,
      overview: "Dockside noir.",
      genres: ["Drama"],
      runtimeMinutes: 118,
      libraryId: 42,
    });
  });

  it("maps series candidate in library with episode statistics", () => {
    const actual = mapSeriesCandidate(
      {
        id: 9,
        tvdbId: 321,
        title: "Harbor Show",
        year: 2022,
        images: [],
        statistics: { episodeFileCount: 12, episodeCount: 24 },
      },
      "http://192.168.1.10:8989",
    );
    expect(actual).toEqual({
      tvdbId: 321,
      title: "Harbor Show",
      year: 2022,
      posterUrl: undefined,
      inLibrary: true,
      episodeFileCount: 12,
      episodeCount: 24,
      overview: "",
      genres: [],
      runtimeMinutes: undefined,
      libraryId: 9,
    });
  });

  it("maps series candidate without id as not in library with zero counts", () => {
    const actual = mapSeriesCandidate(
      {
        tvdbId: 1,
        title: "Fresh Show",
        year: 2026,
        images: [],
      },
      "http://192.168.1.10:8989",
    );
    expect(actual).toEqual({
      tvdbId: 1,
      title: "Fresh Show",
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
  });

  it("maps series candidate overview genres runtime and libraryId", () => {
    const actual = mapSeriesCandidate(
      {
        id: 9,
        tvdbId: 321,
        title: "Harbor Show",
        year: 2022,
        overview: "Dockside drama.",
        genres: ["Drama"],
        runtime: 45,
        images: [],
        statistics: { episodeFileCount: 12, episodeCount: 24 },
      },
      "http://192.168.1.10:8989",
    );
    expect(actual).toMatchObject({
      tvdbId: 321,
      inLibrary: true,
      overview: "Dockside drama.",
      genres: ["Drama"],
      runtimeMinutes: 45,
      libraryId: 9,
      episodeFileCount: 12,
      episodeCount: 24,
    });
  });

  it("maps sonarr series overview and qualityProfileId", () => {
    const actual = mapSonarrSeries(
      {
        id: 5,
        title: "Harbor Show",
        year: 2022,
        monitored: true,
        status: "continuing",
        overview: "Dockside drama.",
        qualityProfileId: 2,
        images: [],
        statistics: { episodeFileCount: 3, episodeCount: 10 },
      },
      "http://192.168.1.10:8989",
    );
    expect(actual.overview).toBe("Dockside drama.");
    expect(actual.qualityProfileId).toBe(2);
    expect(actual.episodeFileCount).toBe(3);
    expect(actual.genres).toEqual([]);
    expect(actual.runtimeMinutes).toBeUndefined();
    expect(actual.network).toBeUndefined();
  });

  it("maps sonarr series genres, runtime, network when present", () => {
    const actual = mapSonarrSeries(
      {
        id: 5,
        title: "Harbor Show",
        year: 2022,
        monitored: true,
        status: "continuing",
        overview: "Dockside drama.",
        qualityProfileId: 2,
        network: "Harbor TV",
        runtime: 45,
        genres: ["Drama"],
        images: [],
        statistics: { episodeFileCount: 3, episodeCount: 10 },
      },
      "http://192.168.1.10:8989",
    );
    expect(actual.genres).toEqual(["Drama"]);
    expect(actual.runtimeMinutes).toBe(45);
    expect(actual.network).toBe("Harbor TV");
  });

  it("maps sonarr episode availability via classifyEpisode", () => {
    const now = new Date("2026-07-15T12:00:00Z");
    const upcoming = mapSonarrEpisode(
      {
        id: 11,
        seasonNumber: 1,
        episodeNumber: 2,
        title: "Fog Bank",
        airDateUtc: "2026-08-01T00:00:00Z",
        hasFile: false,
        monitored: true,
      },
      now,
    );
    const missing = mapSonarrEpisode(
      {
        id: 12,
        seasonNumber: 1,
        episodeNumber: 1,
        title: "Pilot",
        airDateUtc: "2026-07-01T00:00:00Z",
        hasFile: false,
        monitored: true,
      },
      now,
    );
    const available = mapSonarrEpisode(
      {
        id: 13,
        seasonNumber: 2,
        episodeNumber: 1,
        title: "Return",
        airDateUtc: "2026-06-01T00:00:00Z",
        hasFile: true,
        monitored: true,
      },
      now,
    );

    expect(upcoming.availability).toBe("aVenir");
    expect(missing.availability).toBe("aTelecharger");
    expect(available.availability).toBe("dispo");
    expect(available.title).toBe("Return");
  });

  it("groups episodes into sorted seasons", () => {
    const now = new Date("2026-07-15T12:00:00Z");
    const seasons = groupEpisodesIntoSeasons([
      mapSonarrEpisode(
        {
          id: 2,
          seasonNumber: 2,
          episodeNumber: 1,
          title: "B",
          hasFile: true,
          monitored: true,
        },
        now,
      ),
      mapSonarrEpisode(
        {
          id: 1,
          seasonNumber: 1,
          episodeNumber: 2,
          title: "A2",
          hasFile: false,
          airDateUtc: "2026-07-01T00:00:00Z",
          monitored: true,
        },
        now,
      ),
      mapSonarrEpisode(
        {
          id: 3,
          seasonNumber: 1,
          episodeNumber: 1,
          title: "A1",
          hasFile: true,
          monitored: true,
        },
        now,
      ),
    ]);

    expect(seasons.map((season) => season.seasonNumber)).toEqual([1, 2]);
    expect(
      seasons[0]?.episodes.map((episode) => episode.episodeNumber),
    ).toEqual([1, 2]);
  });

  it("computes progress from size and sizeLeft", () => {
    expect(computeProgress(1000, 250)).toBe(0.75);
    expect(computeProgress(0, 0)).toBe(0);
  });

  it("maps queue downloading item", () => {
    const actual = mapQueueItem(
      {
        id: 9,
        title: "Night.Harbor.2024.1080p.WEB-DL.x264",
        status: "downloading",
        size: 1000,
        sizeleft: 250,
        timeleft: "00:10:00",
        trackedDownloadState: "downloading",
        movie: {
          title: "Night Harbor",
          images: [{ coverType: "poster", remoteUrl: "https://cdn/p.jpg" }],
        },
      },
      "radarr",
      "http://192.168.1.10:7878",
    );
    expect(actual.title).toBe("Night Harbor");
    expect(actual.progress).toBe(0.75);
    expect(actual.status).toBe("downloading");
    expect(actual.service).toBe("radarr");
    expect(actual.canPause).toBe(true);
  });

  it("maps queue item movieId from nested movie", () => {
    const actual = mapQueueItem(
      {
        id: 9,
        title: "Night.Harbor.2024.1080p",
        status: "downloading",
        size: 100,
        sizeleft: 40,
        movie: { id: 42, title: "Night Harbor", images: [] },
      },
      "radarr",
      "http://192.168.1.10:7878",
    );
    expect(actual.title).toBe("Night Harbor");
    expect(actual.movieId).toBe(42);
    expect(actual.seriesId).toBeUndefined();
  });

  it("maps sonarr queue title from series and episode, not release name", () => {
    const actual = mapQueueItem(
      {
        id: 3,
        title: "Lakeside.S01E02.1080p.WEB.h264-GROUP",
        status: "downloading",
        size: 500,
        sizeleft: 100,
        series: { id: 5, title: "Lakeside", images: [] },
        episode: {
          seasonNumber: 1,
          episodeNumber: 2,
          title: "Fog Bank",
        },
      },
      "sonarr",
      "http://192.168.1.10:8989",
    );
    expect(actual.title).toBe("S01E02 · Fog Bank");
    expect(actual.seriesId).toBe(5);
  });

  it("maps online health", () => {
    expect(
      mapHealth("sonarr", { version: "4.0.0", appName: "Sonarr" }),
    ).toEqual({
      service: "sonarr",
      online: true,
      version: "4.0.0",
      message: undefined,
    });
  });

  it("maps sonarr series tvMazeId when present", () => {
    const actual = mapSonarrSeries(
      {
        id: 5,
        title: "Harbor Show",
        year: 2022,
        monitored: true,
        status: "continuing",
        overview: "",
        tvMazeId: 169,
        images: [],
        statistics: { episodeFileCount: 0, episodeCount: 0 },
      },
      "http://192.168.1.10:8989",
    );
    expect(actual.tvMazeId).toBe(169);
  });

  it("maps provider ratings and formats labels", () => {
    const scores = mapRatings({
      tmdb: { value: 7.8, votes: 100 },
      imdb: { value: 8.1, votes: 200 },
      rottenTomatoes: { value: 92, votes: 50 },
      crew: { value: 1 },
    });
    expect(scores).toEqual([
      { source: "tmdb", value: 7.8, votes: 100 },
      { source: "imdb", value: 8.1, votes: 200 },
      { source: "rottenTomatoes", value: 92, votes: 50 },
    ]);
    expect(formatRatingLabel(scores[0]!)).toBe("TMDB 7.8");
    expect(formatRatingLabel(scores[2]!)).toBe("RT 92%");
  });

  it("maps radarr credits cast only limited to six", () => {
    const actual = mapRadarrCredits(
      [
        {
          type: "crew",
          personName: "Director",
          order: 0,
          images: [],
        },
        {
          type: "cast",
          personName: "Ada",
          order: 2,
          images: [{ coverType: "headshot", remoteUrl: "https://cdn/ada.jpg" }],
        },
        {
          type: "cast",
          personName: "Bea",
          order: 1,
          images: [{ coverType: "headshot", url: "/MediaCover/1.jpg" }],
        },
        { type: "cast", personName: "Cara", order: 3, images: [] },
        { type: "cast", personName: "Dora", order: 4, images: [] },
        { type: "cast", personName: "Eve", order: 5, images: [] },
        { type: "cast", personName: "Fay", order: 6, images: [] },
        { type: "cast", personName: "Gina", order: 7, images: [] },
        { type: "cast", personName: "  ", order: 8, images: [] },
      ],
      "http://192.168.1.10:7878",
    );
    expect(actual).toEqual([
      {
        name: "Bea",
        photoUrl: "http://192.168.1.10:7878/MediaCover/1.jpg",
      },
      { name: "Ada", photoUrl: "https://cdn/ada.jpg" },
      { name: "Cara", photoUrl: undefined },
      { name: "Dora", photoUrl: undefined },
      { name: "Eve", photoUrl: undefined },
      { name: "Fay", photoUrl: undefined },
    ]);
  });

  it("maps tvmaze cast limited to six with photos", () => {
    const actual = mapTvMazeCast([
      {
        person: {
          name: "Ada",
          image: {
            medium: "https://tvmaze/ada.jpg",
            original: "https://tvmaze/ada-lg.jpg",
          },
        },
      },
      { person: { name: "Bea", image: null } },
      { person: { name: "Ada", image: { medium: "https://dup.jpg" } } },
      { person: { name: "Cara" } },
      { person: { name: "Dora" } },
      { person: { name: "Eve" } },
      { person: { name: "Fay" } },
      { person: { name: "Gina" } },
    ]);
    expect(actual).toEqual([
      { name: "Ada", photoUrl: "https://tvmaze/ada.jpg" },
      { name: "Bea", photoUrl: undefined },
      { name: "Cara", photoUrl: undefined },
      { name: "Dora", photoUrl: undefined },
      { name: "Eve", photoUrl: undefined },
      { name: "Fay", photoUrl: undefined },
    ]);
  });

  it("formats a compact crew line with short jobs", () => {
    setI18nLocale("en");
    const actual = formatCrewLine([
      { job: "Director", name: "Nolan" },
      { job: "Writer", name: "Nolan" },
    ]);
    expect(actual).toBe("Dir. Nolan · Writer Nolan");
  });

  it("returns undefined for empty crew", () => {
    expect(formatCrewLine([])).toBeUndefined();
  });

  it("respects max option for crew line", () => {
    setI18nLocale("en");
    const actual = formatCrewLine(
      [
        { job: "Director", name: "A" },
        { job: "Writer", name: "B" },
        { job: "Creator", name: "C" },
      ],
      { max: 2 },
    );
    expect(actual).toBe("Dir. A · Writer B");
  });
});
