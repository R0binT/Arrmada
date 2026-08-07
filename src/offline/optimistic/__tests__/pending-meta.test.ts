import { QueryClient } from "@tanstack/react-query";

import type { Movie } from "@/arr-client/types";
import { queryKeys } from "@/lib/query-keys";
import { createAddMovieExecutor } from "@/offline/outbox/ops/add-movie";
import {
  buildOptimisticMovie,
  buildOptimisticSeries,
  optimisticMovieId,
  optimisticSeriesId,
} from "../pending-meta";
import {
  clearPendingSyncState,
  getPendingSyncState,
  resetPendingSyncIndex,
  setPendingSyncState,
} from "../pending-sync-index";

describe("pending-meta", () => {
  afterEach(() => {
    resetPendingSyncIndex();
  });

  it("maps tmdb/tvdb ids to negative optimistic ids", () => {
    expect(optimisticMovieId(550)).toBe(-550);
    expect(optimisticSeriesId(78804)).toBe(-78804);
  });

  it("builds an optimistic Movie with defaults and empty arrays", () => {
    const movie = buildOptimisticMovie({
      tmdbId: 550,
      qualityProfileId: 1,
      rootFolderPath: "/movies",
      title: "Fight Club",
      year: 1999,
      posterUrl: "https://example.com/poster.jpg",
      overview: "An overview",
    });

    expect(movie).toMatchObject({
      id: -550,
      title: "Fight Club",
      year: 1999,
      posterUrl: "https://example.com/poster.jpg",
      overview: "An overview",
      hasFile: false,
      monitored: true,
      statusSummary: "",
      qualityProfileId: 1,
      genres: [],
      ratings: [],
      audioLanguageCodes: [],
      subtitleLanguageCodes: [],
      externalIds: {
        imdbId: undefined,
        tmdbId: 550,
        tvdbId: undefined,
        tvMazeId: undefined,
      },
    });
  });

  it("builds an optimistic Series with defaults", () => {
    const series = buildOptimisticSeries({
      tvdbId: 78804,
      qualityProfileId: 2,
      rootFolderPath: "/tv",
      title: "The Boys",
      year: 2019,
      posterUrl: undefined,
      overview: "Overview",
    });

    expect(series).toMatchObject({
      id: -78804,
      title: "The Boys",
      year: 2019,
      monitored: true,
      episodeFileCount: 0,
      episodeCount: 0,
      statusSummary: "",
      qualityProfileId: 2,
      genres: [],
      ratings: [],
      externalIds: {
        imdbId: undefined,
        tmdbId: undefined,
        tvdbId: 78804,
        tvMazeId: undefined,
      },
    });
  });

  it("stores pending sync state by optimistic key", () => {
    setPendingSyncState("movie:550", "pending");
    expect(getPendingSyncState("movie:550")).toBe("pending");
    setPendingSyncState("movie:550", "failed");
    expect(getPendingSyncState("movie:550")).toBe("failed");
    clearPendingSyncState("movie:550");
    expect(getPendingSyncState("movie:550")).toBeUndefined();
  });
});

describe("addMovie optimistic cache patches", () => {
  afterEach(() => {
    resetPendingSyncIndex();
  });

  it("apply inserts placeholder into movies list; rollback removes it", () => {
    const addMovie = jest.fn();
    const executor = createAddMovieExecutor({ addMovie });
    const queryClient = new QueryClient();
    const existing: Movie = {
      id: 1,
      title: "Existing",
      year: 2000,
      posterUrl: undefined,
      monitored: true,
      hasFile: true,
      statusSummary: "ok",
      added: undefined,
      overview: "",
      qualityProfileId: 1,
      fileQuality: undefined,
      audioLanguageCodes: [],
      subtitleLanguageCodes: [],
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
        tmdbId: 1,
        tvdbId: undefined,
        tvMazeId: undefined,
      },
    };
    queryClient.setQueryData(queryKeys.movies.all, [existing]);

    const item = {
      id: "op-1",
      service: "radarr" as const,
      type: "addMovie" as const,
      payload: {
        tmdbId: 550,
        qualityProfileId: 1,
        rootFolderPath: "/movies",
        title: "Fight Club",
        year: 1999,
        posterUrl: undefined,
        overview: "x",
      },
      status: "pending" as const,
      attempts: 0,
      createdAt: "2026-08-07T00:00:00.000Z",
      updatedAt: "2026-08-07T00:00:00.000Z",
      optimisticKey: "movie:550",
    };

    executor.applyOptimistic?.(item, queryClient);
    const afterApply = queryClient.getQueryData<Movie[]>(queryKeys.movies.all);
    expect(afterApply).toHaveLength(2);
    expect(afterApply?.[1]?.id).toBe(-550);
    expect(getPendingSyncState("movie:550")).toBe("pending");

    executor.rollbackOptimistic?.(item, queryClient);
    const afterRollback = queryClient.getQueryData<Movie[]>(
      queryKeys.movies.all,
    );
    expect(afterRollback).toEqual([existing]);
    expect(getPendingSyncState("movie:550")).toBeUndefined();
  });
});
