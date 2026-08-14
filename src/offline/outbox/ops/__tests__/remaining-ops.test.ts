import { QueryClient } from "@tanstack/react-query";

import type { Movie } from "@/arr-client/types";
import { queryKeys } from "@/lib/query-keys";

import type { ArrOutboxItem, ArrOutboxOpType } from "../../types";
import { createDeleteMovieExecutor } from "../delete-movie";
import { createGrabMovieReleaseExecutor } from "../grab-movie-release";
import { createMovieSearchExecutor } from "../movie-search";
import { createQueuePauseOrResumeExecutor } from "../queue-pause-or-resume";
import { createQueueRemoveExecutor } from "../queue-remove";
import { configureOpRegistry, getOpExecutor } from "../registry";

const baseItem = (
  type: ArrOutboxOpType,
  payload: unknown,
  service: "radarr" | "sonarr" = "radarr",
): ArrOutboxItem => ({
  id: `op-${type}`,
  service,
  type,
  payload,
  status: "pending",
  attempts: 0,
  createdAt: "2026-08-07T00:00:00.000Z",
  updatedAt: "2026-08-07T00:00:00.000Z",
});

describe("remaining Arr outbox ops", () => {
  afterEach(() => {
    configureOpRegistry({});
  });

  it("deleteMovie execute calls client then applyOptimistic removes from list", async () => {
    const deleteMovie = jest.fn().mockResolvedValue(undefined);
    const executor = createDeleteMovieExecutor({ deleteMovie });
    const queryClient = new QueryClient();
    const movie = { id: 12, title: "Heat", monitored: true } as Movie;
    queryClient.setQueryData(queryKeys.movies.all, [movie]);
    queryClient.setQueryData(queryKeys.movies.detail(12), movie);
    const item = baseItem("deleteMovie", { movieId: 12, deleteFiles: true });

    executor.applyOptimistic?.(item, queryClient);
    expect(queryClient.getQueryData<Movie[]>(queryKeys.movies.all)).toEqual([]);

    executor.rollbackOptimistic?.(item, queryClient);
    expect(queryClient.getQueryData<Movie[]>(queryKeys.movies.all)).toEqual([
      movie,
    ]);

    await executor.execute(item, {});
    expect(deleteMovie).toHaveBeenCalledWith(12, { deleteFiles: true });
  });

  it("movieSearch and grabMovieRelease call the matching client methods", async () => {
    const command = jest.fn().mockResolvedValue({});
    const grabRelease = jest.fn().mockResolvedValue({});
    await createMovieSearchExecutor({ command }).execute(
      baseItem("movieSearch", { movieId: 7 }),
      {},
    );
    await createGrabMovieReleaseExecutor({ grabRelease }).execute(
      baseItem("grabMovieRelease", { guid: "abc", indexerId: 2 }),
      {},
    );
    expect(command).toHaveBeenCalledWith("MoviesSearch", { movieIds: [7] });
    expect(grabRelease).toHaveBeenCalledWith({ guid: "abc", indexerId: 2 });
  });

  it("queuePauseOrResume picks Resume when currently paused", async () => {
    const command = jest.fn().mockResolvedValue({});
    const executor = createQueuePauseOrResumeExecutor({ radarr: { command } });
    await executor.execute(
      baseItem(
        "queuePauseOrResume",
        { downloadId: "dl-1", isPaused: true },
        "radarr",
      ),
      {},
    );
    expect(command).toHaveBeenCalledWith("DownloadClientResume", {
      downloadId: "dl-1",
    });
  });

  it("queueRemove uses item.service to pick the client", async () => {
    const radarrRemove = jest.fn().mockResolvedValue({});
    const sonarrRemove = jest.fn().mockResolvedValue({});
    const executor = createQueueRemoveExecutor({
      radarr: { removeQueueItem: radarrRemove },
      sonarr: { removeQueueItem: sonarrRemove },
    });
    await executor.execute(
      baseItem(
        "queueRemove",
        { id: 9, removeFromClient: true, blocklist: false },
        "sonarr",
      ),
      {},
    );
    expect(sonarrRemove).toHaveBeenCalledWith(9, {
      removeFromClient: true,
      blocklist: false,
    });
    expect(radarrRemove).not.toHaveBeenCalled();
  });

  it("registry routes updateMovieMonitored to the radarr client", async () => {
    const updateMovie = jest.fn().mockResolvedValue({});
    configureOpRegistry({
      radarr: { updateMovie } as never,
      sonarr: {} as never,
    });
    await getOpExecutor("updateMovieMonitored").execute(
      baseItem("updateMovieMonitored", { movieId: 12, monitored: false }),
      {},
    );
    expect(updateMovie).toHaveBeenCalledWith(12, { monitored: false });
  });
});
