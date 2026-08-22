import { QueryClient } from "@tanstack/react-query";

import type { Movie } from "@/arr-client/types";
import { queryKeys } from "@/lib/query-keys";

import type { ArrOutboxItem } from "../../types";
import { createUpdateMovieMonitoredExecutor } from "../update-movie-monitored";

const movie = (overrides: Partial<Movie> = {}): Movie =>
  ({
    id: 12,
    title: "Heat",
    year: 1995,
    posterUrl: undefined,
    monitored: true,
    hasFile: true,
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
      tmdbId: 949,
      tvdbId: undefined,
      tvMazeId: undefined,
    },
    ...overrides,
  }) as Movie;

const makeItem = (
  payload: { readonly movieId: number; readonly monitored: boolean },
): ArrOutboxItem => ({
  id: "op-monitored-1",
  service: "radarr",
  type: "updateMovieMonitored",
  payload,
  status: "pending",
  attempts: 0,
  createdAt: "2026-08-07T00:00:00.000Z",
  updatedAt: "2026-08-07T00:00:00.000Z",
});

describe("updateMovieMonitored op", () => {
  it("execute calls radarr.updateMovie with id and monitored flag", async () => {
    const updateMovie = jest.fn().mockResolvedValue(movie({ monitored: false }));
    const executor = createUpdateMovieMonitoredExecutor({ updateMovie });

    await executor.execute(makeItem({ movieId: 12, monitored: false }), {});

    expect(updateMovie).toHaveBeenCalledWith(12, { monitored: false });
  });

  it("applyOptimistic patches list and detail monitored then rollback restores", () => {
    const executor = createUpdateMovieMonitoredExecutor({
      updateMovie: jest.fn(),
    });
    const queryClient = new QueryClient();
    const original = movie({ monitored: true });
    queryClient.setQueryData(queryKeys.movies.all, [original]);
    queryClient.setQueryData(queryKeys.movies.detail(12), original);
    const item = makeItem({ movieId: 12, monitored: false });

    executor.applyOptimistic?.(item, queryClient);

    expect(
      queryClient.getQueryData<Movie[]>(queryKeys.movies.all)?.[0]?.monitored,
    ).toBe(false);
    expect(
      queryClient.getQueryData<Movie>(queryKeys.movies.detail(12))?.monitored,
    ).toBe(false);

    executor.rollbackOptimistic?.(item, queryClient);

    expect(
      queryClient.getQueryData<Movie[]>(queryKeys.movies.all)?.[0]?.monitored,
    ).toBe(true);
    expect(
      queryClient.getQueryData<Movie>(queryKeys.movies.detail(12))?.monitored,
    ).toBe(true);
  });
});
