import type { QueryClient } from "@tanstack/react-query";

import type { Movie } from "@/arr-client/types";
import { queryKeys } from "@/lib/query-keys";

import type { OpExecutor, OpExecutorContext } from "../dispatcher";
import type { ArrOutboxItem } from "../types";
import { asQueryClient } from "./as-query-client";

type DeleteMoviePayload = {
  readonly movieId: number;
  readonly deleteFiles: boolean;
  readonly snapshot?: Movie;
};

export type DeleteMovieClient = {
  readonly deleteMovie: (
    id: number,
    options: { readonly deleteFiles: boolean },
  ) => Promise<void>;
};

type MovieDeleteSnapshot = {
  readonly list: Movie[] | undefined;
  readonly detail: Movie | undefined;
};

const snapshots = new Map<string, MovieDeleteSnapshot>();

const isPayload = (value: unknown): value is DeleteMoviePayload => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.movieId === "number" && typeof record.deleteFiles === "boolean"
  );
};

const requirePayload = (item: ArrOutboxItem): DeleteMoviePayload => {
  if (!isPayload(item.payload)) {
    throw new Error("Invalid deleteMovie outbox payload");
  }
  return item.payload;
};

const removeMovieFromCache = (
  queryClient: QueryClient,
  movieId: number,
): void => {
  queryClient.setQueryData<Movie[]>(queryKeys.movies.all, (current) => {
    if (current === undefined) {
      return current;
    }
    return current.filter((movie) => movie.id !== movieId);
  });
  queryClient.removeQueries({ queryKey: queryKeys.movies.detail(movieId) });
};

const restoreMovieFromPayload = (
  queryClient: QueryClient,
  movieId: number,
  payloadSnapshot: Movie,
): void => {
  queryClient.setQueryData<Movie[]>(queryKeys.movies.all, (current) => {
    if (current === undefined) {
      return [payloadSnapshot];
    }
    if (current.some((movie) => movie.id === payloadSnapshot.id)) {
      return current;
    }
    return [...current, payloadSnapshot];
  });
  queryClient.setQueryData(queryKeys.movies.detail(movieId), payloadSnapshot);
};

/**
 * Outbox executor for movie deletes.
 */
export const createDeleteMovieExecutor = (
  client: DeleteMovieClient,
): OpExecutor => ({
  applyOptimistic: (item: ArrOutboxItem, qc: unknown): void => {
    const payload = requirePayload(item);
    const queryClient = asQueryClient(qc);
    if (queryClient === undefined) {
      return;
    }
    snapshots.set(item.id, {
      list: queryClient.getQueryData<Movie[]>(queryKeys.movies.all),
      detail: queryClient.getQueryData<Movie>(
        queryKeys.movies.detail(payload.movieId),
      ),
    });
    removeMovieFromCache(queryClient, payload.movieId);
  },
  rollbackOptimistic: (item: ArrOutboxItem, qc: unknown): void => {
    const payload = requirePayload(item);
    const queryClient = asQueryClient(qc);
    const snapshot = snapshots.get(item.id);
    snapshots.delete(item.id);
    if (queryClient === undefined) {
      return;
    }
    if (snapshot !== undefined) {
      if (snapshot.list !== undefined) {
        queryClient.setQueryData(queryKeys.movies.all, snapshot.list);
      }
      if (snapshot.detail !== undefined) {
        queryClient.setQueryData(
          queryKeys.movies.detail(payload.movieId),
          snapshot.detail,
        );
      }
      return;
    }
    if (payload.snapshot !== undefined) {
      restoreMovieFromPayload(queryClient, payload.movieId, payload.snapshot);
    }
  },
  execute: async (
    item: ArrOutboxItem,
    ctx: OpExecutorContext,
  ): Promise<void> => {
    const payload = requirePayload(item);
    await client.deleteMovie(payload.movieId, {
      deleteFiles: payload.deleteFiles,
    });
    snapshots.delete(item.id);
    const queryClient = asQueryClient(ctx.queryClient);
    if (queryClient === undefined) {
      return;
    }
    queryClient.removeQueries({
      queryKey: queryKeys.movies.detail(payload.movieId),
    });
    await queryClient.invalidateQueries({ queryKey: queryKeys.movies.all });
  },
});
