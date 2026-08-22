import type { QueryClient } from "@tanstack/react-query";

import type { Movie } from "@/arr-client/types";
import { queryKeys } from "@/lib/query-keys";
import {
  buildOptimisticMovie,
  clearPendingSyncState,
  optimisticMovieId,
  setPendingSyncState,
  type OptimisticAddMoviePayload,
} from "@/offline/optimistic/pending-meta";
import type { OpExecutor, OpExecutorContext } from "../dispatcher";
import type { ArrOutboxItem } from "../types";

export type AddMovieClient = {
  readonly addMovie: (input: {
    readonly tmdbId: number;
    readonly qualityProfileId: number;
    readonly rootFolderPath: string;
  }) => Promise<unknown>;
};

const isAddMoviePayload = (value: unknown): value is OptimisticAddMoviePayload => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.tmdbId === "number" &&
    typeof record.qualityProfileId === "number" &&
    typeof record.rootFolderPath === "string" &&
    typeof record.title === "string" &&
    typeof record.year === "number" &&
    typeof record.overview === "string" &&
    (record.posterUrl === undefined || typeof record.posterUrl === "string")
  );
};

const requirePayload = (item: ArrOutboxItem): OptimisticAddMoviePayload => {
  if (!isAddMoviePayload(item.payload)) {
    throw new Error("Invalid addMovie outbox payload");
  }
  return item.payload;
};

const resolveOptimisticKey = (
  item: ArrOutboxItem,
  payload: OptimisticAddMoviePayload,
): string => item.optimisticKey ?? `movie:${payload.tmdbId}`;

const asQueryClient = (qc: unknown): QueryClient | undefined => {
  if (
    typeof qc === "object" &&
    qc !== null &&
    "setQueryData" in qc &&
    "getQueryData" in qc &&
    "invalidateQueries" in qc
  ) {
    return qc as QueryClient;
  }
  return undefined;
};

const removeOptimisticMovie = (
  queryClient: QueryClient,
  optimisticId: number,
): void => {
  queryClient.setQueryData<Movie[]>(queryKeys.movies.all, (current) => {
    if (current === undefined) {
      return current;
    }
    return current.filter((movie) => movie.id !== optimisticId);
  });
};

/**
 * Outbox executor for offline-friendly movie adds.
 */
export const createAddMovieExecutor = (client: AddMovieClient): OpExecutor => ({
  applyOptimistic: (item: ArrOutboxItem, qc: unknown): void => {
    const payload = requirePayload(item);
    const optimisticKey = resolveOptimisticKey(item, payload);
    setPendingSyncState(optimisticKey, "pending");
    const queryClient = asQueryClient(qc);
    if (queryClient === undefined) {
      return;
    }
    const movie = buildOptimisticMovie(payload);
    queryClient.setQueryData<Movie[]>(queryKeys.movies.all, (current) => {
      const list = current ?? [];
      if (list.some((row) => row.id === movie.id)) {
        return list;
      }
      return [...list, movie];
    });
  },
  rollbackOptimistic: (item: ArrOutboxItem, qc: unknown): void => {
    const payload = requirePayload(item);
    const optimisticKey = resolveOptimisticKey(item, payload);
    clearPendingSyncState(optimisticKey);
    const queryClient = asQueryClient(qc);
    if (queryClient === undefined) {
      return;
    }
    removeOptimisticMovie(queryClient, optimisticMovieId(payload.tmdbId));
  },
  execute: async (
    item: ArrOutboxItem,
    ctx: OpExecutorContext,
  ): Promise<void> => {
    const payload = requirePayload(item);
    await client.addMovie({
      tmdbId: payload.tmdbId,
      qualityProfileId: payload.qualityProfileId,
      rootFolderPath: payload.rootFolderPath,
    });
    const optimisticKey = resolveOptimisticKey(item, payload);
    clearPendingSyncState(optimisticKey);
    const queryClient = asQueryClient(ctx.queryClient);
    if (queryClient === undefined) {
      return;
    }
    removeOptimisticMovie(queryClient, optimisticMovieId(payload.tmdbId));
    await queryClient.invalidateQueries({ queryKey: queryKeys.movies.all });
  },
});
