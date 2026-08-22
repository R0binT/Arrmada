import type { QueryClient } from "@tanstack/react-query";

import type { Season, Series } from "@/arr-client/types";
import { queryKeys } from "@/lib/query-keys";

import type { OpExecutor, OpExecutorContext } from "../dispatcher";
import type { ArrOutboxItem } from "../types";
import { asQueryClient } from "./as-query-client";

type DeleteSeriesPayload = {
  readonly seriesId: number;
  readonly deleteFiles: boolean;
  readonly snapshot?: Series;
  readonly seasons?: readonly Season[];
};

export type DeleteSeriesClient = {
  readonly deleteSeries: (
    id: number,
    options: { readonly deleteFiles: boolean },
  ) => Promise<void>;
};

type SeriesDeleteSnapshot = {
  readonly list: Series[] | undefined;
  readonly detail: Series | undefined;
  readonly seasons: Season[] | undefined;
};

const snapshots = new Map<string, SeriesDeleteSnapshot>();

const isPayload = (value: unknown): value is DeleteSeriesPayload => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.seriesId === "number" &&
    typeof record.deleteFiles === "boolean"
  );
};

const requirePayload = (item: ArrOutboxItem): DeleteSeriesPayload => {
  if (!isPayload(item.payload)) {
    throw new Error("Invalid deleteSeries outbox payload");
  }
  return item.payload;
};

const removeSeriesFromCache = (
  queryClient: QueryClient,
  seriesId: number,
): void => {
  queryClient.setQueryData<Series[]>(queryKeys.series.all, (current) => {
    if (current === undefined) {
      return current;
    }
    return current.filter((series) => series.id !== seriesId);
  });
  queryClient.removeQueries({ queryKey: queryKeys.series.detail(seriesId) });
  queryClient.removeQueries({ queryKey: queryKeys.series.seasons(seriesId) });
};

const restoreSeriesFromPayload = (
  queryClient: QueryClient,
  payload: DeleteSeriesPayload,
): void => {
  if (payload.snapshot === undefined) {
    return;
  }
  const payloadSnapshot = payload.snapshot;
  queryClient.setQueryData<Series[]>(queryKeys.series.all, (current) => {
    if (current === undefined) {
      return [payloadSnapshot];
    }
    if (current.some((series) => series.id === payloadSnapshot.id)) {
      return current;
    }
    return [...current, payloadSnapshot];
  });
  queryClient.setQueryData(
    queryKeys.series.detail(payload.seriesId),
    payloadSnapshot,
  );
  if (payload.seasons !== undefined) {
    queryClient.setQueryData(
      queryKeys.series.seasons(payload.seriesId),
      payload.seasons,
    );
  }
};

/**
 * Outbox executor for series deletes.
 */
export const createDeleteSeriesExecutor = (
  client: DeleteSeriesClient,
): OpExecutor => ({
  applyOptimistic: (item: ArrOutboxItem, qc: unknown): void => {
    const payload = requirePayload(item);
    const queryClient = asQueryClient(qc);
    if (queryClient === undefined) {
      return;
    }
    snapshots.set(item.id, {
      list: queryClient.getQueryData<Series[]>(queryKeys.series.all),
      detail: queryClient.getQueryData<Series>(
        queryKeys.series.detail(payload.seriesId),
      ),
      seasons: queryClient.getQueryData<Season[]>(
        queryKeys.series.seasons(payload.seriesId),
      ),
    });
    removeSeriesFromCache(queryClient, payload.seriesId);
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
        queryClient.setQueryData(queryKeys.series.all, snapshot.list);
      }
      if (snapshot.detail !== undefined) {
        queryClient.setQueryData(
          queryKeys.series.detail(payload.seriesId),
          snapshot.detail,
        );
      }
      if (snapshot.seasons !== undefined) {
        queryClient.setQueryData(
          queryKeys.series.seasons(payload.seriesId),
          snapshot.seasons,
        );
      }
      return;
    }
    restoreSeriesFromPayload(queryClient, payload);
  },
  execute: async (
    item: ArrOutboxItem,
    ctx: OpExecutorContext,
  ): Promise<void> => {
    const payload = requirePayload(item);
    await client.deleteSeries(payload.seriesId, {
      deleteFiles: payload.deleteFiles,
    });
    snapshots.delete(item.id);
    const queryClient = asQueryClient(ctx.queryClient);
    if (queryClient === undefined) {
      return;
    }
    queryClient.removeQueries({
      queryKey: queryKeys.series.detail(payload.seriesId),
    });
    queryClient.removeQueries({
      queryKey: queryKeys.series.seasons(payload.seriesId),
    });
    await queryClient.invalidateQueries({ queryKey: queryKeys.series.all });
  },
});
