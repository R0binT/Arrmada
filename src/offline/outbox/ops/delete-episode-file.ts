import type { QueryClient } from "@tanstack/react-query";

import type { Season } from "@/arr-client/types";
import { queryKeys } from "@/lib/query-keys";

import type { OpExecutor, OpExecutorContext } from "../dispatcher";
import type { ArrOutboxItem } from "../types";
import { asQueryClient } from "./as-query-client";

type DeleteEpisodeFilePayload = {
  readonly seriesId: number;
  readonly episodeFileId: number;
};

export type DeleteEpisodeFileClient = {
  readonly deleteEpisodeFile: (episodeFileId: number) => Promise<void>;
};

const snapshots = new Map<string, Season[] | undefined>();

const isPayload = (value: unknown): value is DeleteEpisodeFilePayload => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.seriesId === "number" &&
    typeof record.episodeFileId === "number"
  );
};

const requirePayload = (item: ArrOutboxItem): DeleteEpisodeFilePayload => {
  if (!isPayload(item.payload)) {
    throw new Error("Invalid deleteEpisodeFile outbox payload");
  }
  return item.payload;
};

const patchEpisodeFileRemoved = (
  queryClient: QueryClient,
  seriesId: number,
  episodeFileId: number,
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
          episode.episodeFileId === episodeFileId
            ? { ...episode, hasFile: false, episodeFileId: undefined }
            : episode,
        ),
      }));
    },
  );
};

/**
 * Outbox executor for episode file deletes.
 */
export const createDeleteEpisodeFileExecutor = (
  client: DeleteEpisodeFileClient,
): OpExecutor => ({
  applyOptimistic: (item: ArrOutboxItem, qc: unknown): void => {
    const payload = requirePayload(item);
    const queryClient = asQueryClient(qc);
    if (queryClient === undefined) {
      return;
    }
    snapshots.set(
      item.id,
      queryClient.getQueryData<Season[]>(
        queryKeys.series.seasons(payload.seriesId),
      ),
    );
    patchEpisodeFileRemoved(
      queryClient,
      payload.seriesId,
      payload.episodeFileId,
    );
  },
  rollbackOptimistic: (item: ArrOutboxItem, qc: unknown): void => {
    const payload = requirePayload(item);
    const queryClient = asQueryClient(qc);
    const snapshot = snapshots.get(item.id);
    snapshots.delete(item.id);
    if (queryClient === undefined || snapshot === undefined) {
      return;
    }
    queryClient.setQueryData(
      queryKeys.series.seasons(payload.seriesId),
      snapshot,
    );
  },
  execute: async (
    item: ArrOutboxItem,
    ctx: OpExecutorContext,
  ): Promise<void> => {
    const payload = requirePayload(item);
    await client.deleteEpisodeFile(payload.episodeFileId);
    snapshots.delete(item.id);
    const queryClient = asQueryClient(ctx.queryClient);
    if (queryClient === undefined) {
      return;
    }
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: queryKeys.series.seasons(payload.seriesId),
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.series.detail(payload.seriesId),
      }),
      queryClient.invalidateQueries({ queryKey: queryKeys.series.all }),
    ]);
  },
});
