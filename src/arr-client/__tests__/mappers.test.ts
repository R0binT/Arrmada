import { mapHealth } from "../mappers/health";
import { mapMovieCandidate, mapRadarrMovie } from "../mappers/movie";
import { computeProgress, mapQueueItem } from "../mappers/queue";
import {
    groupEpisodesIntoSeasons,
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
});
