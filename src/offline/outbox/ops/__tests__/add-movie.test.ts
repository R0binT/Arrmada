import { QueryClient } from "@tanstack/react-query";

import type { Movie } from "@/arr-client/types";
import { queryKeys } from "@/lib/query-keys";
import { getPendingSyncState, resetPendingSyncIndex } from "@/offline/optimistic/pending-sync-index";
import { createAddMovieExecutor } from "../add-movie";
import { createAddSeriesExecutor } from "../add-series";
import { configureOpRegistry, getOpExecutor } from "../registry";
import type { ArrOutboxItem } from "../../types";

const baseMoviePayload = {
  tmdbId: 550,
  qualityProfileId: 1,
  rootFolderPath: "/movies",
  title: "Fight Club",
  year: 1999,
  posterUrl: "https://example.com/p.jpg" as string | undefined,
  overview: "An overview",
};

const makeAddMovieItem = (
  overrides: Partial<ArrOutboxItem> = {},
): ArrOutboxItem => ({
  id: "op-1",
  service: "radarr",
  type: "addMovie",
  payload: baseMoviePayload,
  status: "pending",
  attempts: 0,
  createdAt: "2026-08-07T00:00:00.000Z",
  updatedAt: "2026-08-07T00:00:00.000Z",
  optimisticKey: "movie:550",
  ...overrides,
});

describe("addMovie / addSeries ops", () => {
  afterEach(() => {
    resetPendingSyncIndex();
    configureOpRegistry({});
  });

  it("execute calls radarr.addMovie with Arr fields only then clears optimistic row", async () => {
    const addMovie = jest.fn().mockResolvedValue({ id: 99 });
    const executor = createAddMovieExecutor({ addMovie });
    const queryClient = new QueryClient();
    const optimistic: Movie = {
      id: -550,
      title: "Fight Club",
      year: 1999,
      posterUrl: undefined,
      monitored: true,
      hasFile: false,
      statusSummary: "",
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
        tmdbId: 550,
        tvdbId: undefined,
        tvMazeId: undefined,
      },
    };
    queryClient.setQueryData(queryKeys.movies.all, [optimistic]);
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    await executor.execute(makeAddMovieItem(), { queryClient });

    expect(addMovie).toHaveBeenCalledWith({
      tmdbId: 550,
      qualityProfileId: 1,
      rootFolderPath: "/movies",
    });
    expect(queryClient.getQueryData<Movie[]>(queryKeys.movies.all)).toEqual([]);
    expect(getPendingSyncState("movie:550")).toBeUndefined();
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.movies.all,
    });
  });

  it("execute calls sonarr.addSeries with Arr fields only", async () => {
    const addSeries = jest.fn().mockResolvedValue({ id: 42 });
    const executor = createAddSeriesExecutor({ addSeries });
    const queryClient = new QueryClient();
    queryClient.setQueryData(queryKeys.series.all, [
      { id: -78804, title: "The Boys" },
    ]);

    await executor.execute(
      {
        id: "op-2",
        service: "sonarr",
        type: "addSeries",
        payload: {
          tvdbId: 78804,
          qualityProfileId: 2,
          rootFolderPath: "/tv",
          title: "The Boys",
          year: 2019,
          posterUrl: undefined,
          overview: "x",
        },
        status: "pending",
        attempts: 0,
        createdAt: "2026-08-07T00:00:00.000Z",
        updatedAt: "2026-08-07T00:00:00.000Z",
        optimisticKey: "series:78804",
      },
      { queryClient },
    );

    expect(addSeries).toHaveBeenCalledWith({
      tvdbId: 78804,
      qualityProfileId: 2,
      rootFolderPath: "/tv",
    });
    expect(queryClient.getQueryData(queryKeys.series.all)).toEqual([]);
  });

  it("registry getOpExecutor(addMovie) execute calls configured client", async () => {
    const addMovie = jest.fn().mockResolvedValue({});
    const addSeries = jest.fn().mockResolvedValue({});
    configureOpRegistry({
      radarr: { addMovie } as never,
      sonarr: { addSeries } as never,
    });

    const executor = getOpExecutor("addMovie");
    await executor.execute(makeAddMovieItem(), {});

    expect(addMovie).toHaveBeenCalledTimes(1);
    expect(addMovie).toHaveBeenCalledWith({
      tmdbId: 550,
      qualityProfileId: 1,
      rootFolderPath: "/movies",
    });
  });

  it("registry still throws for unregistered op types", async () => {
    configureOpRegistry({});
    const executor = getOpExecutor("deleteMovie");
    await expect(
      executor.execute(makeAddMovieItem({ type: "deleteMovie" }), {}),
    ).rejects.toThrow("unregistered op: deleteMovie");
  });
});
