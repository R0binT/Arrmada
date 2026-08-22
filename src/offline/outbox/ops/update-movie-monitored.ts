import type { Movie } from "@/arr-client/types";
import { queryKeys } from "@/lib/query-keys";

import type { OpExecutor, OpExecutorContext } from "../dispatcher";
import type { ArrOutboxItem } from "../types";
import { asQueryClient } from "./as-query-client";

type UpdateMovieMonitoredPayload = {
  readonly movieId: number;
  readonly monitored: boolean;
};

export type UpdateMovieMonitoredClient = {
  readonly updateMovie: (
    id: number,
    changes: { readonly monitored: boolean },
  ) => Promise<unknown>;
};

const isPayload = (value: unknown): value is UpdateMovieMonitoredPayload => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.movieId === "number" && typeof record.monitored === "boolean"
  );
};

const requirePayload = (item: ArrOutboxItem): UpdateMovieMonitoredPayload => {
  if (!isPayload(item.payload)) {
    throw new Error("Invalid updateMovieMonitored outbox payload");
  }
  return item.payload;
};

const patchMovieMonitored = (
  queryClient: NonNullable<ReturnType<typeof asQueryClient>>,
  movieId: number,
  monitored: boolean,
): void => {
  queryClient.setQueryData<Movie[]>(queryKeys.movies.all, (current) => {
    if (current === undefined) {
      return current;
    }
    return current.map((movie) =>
      movie.id === movieId ? { ...movie, monitored } : movie,
    );
  });
  queryClient.setQueryData<Movie>(
    queryKeys.movies.detail(movieId),
    (current) => {
      if (current === undefined) {
        return current;
      }
      return { ...current, monitored };
    },
  );
};

/**
 * Outbox executor for movie monitored toggles.
 */
export const createUpdateMovieMonitoredExecutor = (
  client: UpdateMovieMonitoredClient,
): OpExecutor => ({
  applyOptimistic: (item: ArrOutboxItem, qc: unknown): void => {
    const payload = requirePayload(item);
    const queryClient = asQueryClient(qc);
    if (queryClient === undefined) {
      return;
    }
    patchMovieMonitored(queryClient, payload.movieId, payload.monitored);
  },
  rollbackOptimistic: (item: ArrOutboxItem, qc: unknown): void => {
    const payload = requirePayload(item);
    const queryClient = asQueryClient(qc);
    if (queryClient === undefined) {
      return;
    }
    patchMovieMonitored(queryClient, payload.movieId, !payload.monitored);
  },
  execute: async (
    item: ArrOutboxItem,
    ctx: OpExecutorContext,
  ): Promise<void> => {
    const payload = requirePayload(item);
    await client.updateMovie(payload.movieId, { monitored: payload.monitored });
    const queryClient = asQueryClient(ctx.queryClient);
    if (queryClient === undefined) {
      return;
    }
    await queryClient.invalidateQueries({ queryKey: queryKeys.movies.all });
    await queryClient.invalidateQueries({
      queryKey: queryKeys.movies.detail(payload.movieId),
    });
  },
});
