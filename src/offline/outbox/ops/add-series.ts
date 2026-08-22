import type { QueryClient } from "@tanstack/react-query";

import type { Series } from "@/arr-client/types";
import { queryKeys } from "@/lib/query-keys";
import {
  buildOptimisticSeries,
  clearPendingSyncState,
  optimisticSeriesId,
  setPendingSyncState,
  type OptimisticAddSeriesPayload,
} from "@/offline/optimistic/pending-meta";
import type { OpExecutor, OpExecutorContext } from "../dispatcher";
import type { ArrOutboxItem } from "../types";

export type AddSeriesClient = {
  readonly addSeries: (input: {
    readonly tvdbId: number;
    readonly qualityProfileId: number;
    readonly rootFolderPath: string;
  }) => Promise<unknown>;
};

const isAddSeriesPayload = (
  value: unknown,
): value is OptimisticAddSeriesPayload => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.tvdbId === "number" &&
    typeof record.qualityProfileId === "number" &&
    typeof record.rootFolderPath === "string" &&
    typeof record.title === "string" &&
    typeof record.year === "number" &&
    typeof record.overview === "string" &&
    (record.posterUrl === undefined || typeof record.posterUrl === "string")
  );
};

const requirePayload = (item: ArrOutboxItem): OptimisticAddSeriesPayload => {
  if (!isAddSeriesPayload(item.payload)) {
    throw new Error("Invalid addSeries outbox payload");
  }
  return item.payload;
};

const resolveOptimisticKey = (
  item: ArrOutboxItem,
  payload: OptimisticAddSeriesPayload,
): string => item.optimisticKey ?? `series:${payload.tvdbId}`;

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

const removeOptimisticSeries = (
  queryClient: QueryClient,
  optimisticId: number,
): void => {
  queryClient.setQueryData<Series[]>(queryKeys.series.all, (current) => {
    if (current === undefined) {
      return current;
    }
    return current.filter((series) => series.id !== optimisticId);
  });
};

/**
 * Outbox executor for offline-friendly series adds.
 */
export const createAddSeriesExecutor = (
  client: AddSeriesClient,
): OpExecutor => ({
  applyOptimistic: (item: ArrOutboxItem, qc: unknown): void => {
    const payload = requirePayload(item);
    const optimisticKey = resolveOptimisticKey(item, payload);
    setPendingSyncState(optimisticKey, "pending");
    const queryClient = asQueryClient(qc);
    if (queryClient === undefined) {
      return;
    }
    const series = buildOptimisticSeries(payload);
    queryClient.setQueryData<Series[]>(queryKeys.series.all, (current) => {
      const list = current ?? [];
      if (list.some((row) => row.id === series.id)) {
        return list;
      }
      return [...list, series];
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
    removeOptimisticSeries(queryClient, optimisticSeriesId(payload.tvdbId));
  },
  execute: async (
    item: ArrOutboxItem,
    ctx: OpExecutorContext,
  ): Promise<void> => {
    const payload = requirePayload(item);
    await client.addSeries({
      tvdbId: payload.tvdbId,
      qualityProfileId: payload.qualityProfileId,
      rootFolderPath: payload.rootFolderPath,
    });
    const optimisticKey = resolveOptimisticKey(item, payload);
    clearPendingSyncState(optimisticKey);
    const queryClient = asQueryClient(ctx.queryClient);
    if (queryClient === undefined) {
      return;
    }
    removeOptimisticSeries(queryClient, optimisticSeriesId(payload.tvdbId));
    await queryClient.invalidateQueries({ queryKey: queryKeys.series.all });
  },
});
