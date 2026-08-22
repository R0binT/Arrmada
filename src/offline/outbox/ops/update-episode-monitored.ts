import type { QueryClient } from "@tanstack/react-query";

import type { Season } from "@/arr-client/types";
import { queryKeys } from "@/lib/query-keys";

import type { OpExecutor, OpExecutorContext } from "../dispatcher";
import type { ArrOutboxItem } from "../types";
import { asQueryClient } from "./as-query-client";

type UpdateEpisodeMonitoredPayload = {
  readonly seriesId: number;
  readonly episodeId: number;
  readonly monitored: boolean;
};

export type UpdateEpisodeMonitoredClient = {
  readonly updateEpisode: (
    id: number,
    changes: { readonly monitored: boolean },
  ) => Promise<unknown>;
};

const isPayload = (value: unknown): value is UpdateEpisodeMonitoredPayload => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.seriesId === "number" &&
    typeof record.episodeId === "number" &&
    typeof record.monitored === "boolean"
  );
};

const requirePayload = (item: ArrOutboxItem): UpdateEpisodeMonitoredPayload => {
  if (!isPayload(item.payload)) {
    throw new Error("Invalid updateEpisodeMonitored outbox payload");
  }
  return item.payload;
};

const patchEpisodeMonitored = (
  queryClient: QueryClient,
  seriesId: number,
  episodeId: number,
  monitored: boolean,
): void => {
  queryClient.setQueryData<Season[]>(
    queryKeys.series.seasons(seriesId),
    (current) => {
      if (current === undefined) {
        return current;
      }
      return current.map((season) => ({
        ...season,
        episodes: season.episodes.map((episode) =>
          episode.id === episodeId ? { ...episode, monitored } : episode,
        ),
      }));
    },
  );
};

/**
 * Outbox executor for episode monitored toggles.
 */
export const createUpdateEpisodeMonitoredExecutor = (
  client: UpdateEpisodeMonitoredClient,
): OpExecutor => ({
  applyOptimistic: (item: ArrOutboxItem, qc: unknown): void => {
    const payload = requirePayload(item);
    const queryClient = asQueryClient(qc);
    if (queryClient === undefined) {
      return;
    }
    patchEpisodeMonitored(
      queryClient,
      payload.seriesId,
      payload.episodeId,
      payload.monitored,
    );
  },
  rollbackOptimistic: (item: ArrOutboxItem, qc: unknown): void => {
    const payload = requirePayload(item);
    const queryClient = asQueryClient(qc);
    if (queryClient === undefined) {
      return;
    }
    patchEpisodeMonitored(
      queryClient,
      payload.seriesId,
      payload.episodeId,
      !payload.monitored,
    );
  },
  execute: async (
    item: ArrOutboxItem,
    ctx: OpExecutorContext,
  ): Promise<void> => {
    const payload = requirePayload(item);
    await client.updateEpisode(payload.episodeId, {
      monitored: payload.monitored,
    });
    const queryClient = asQueryClient(ctx.queryClient);
    if (queryClient === undefined) {
      return;
    }
    await queryClient.invalidateQueries({
      queryKey: queryKeys.series.seasons(payload.seriesId),
    });
  },
});
