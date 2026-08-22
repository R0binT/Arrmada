import type { QueryClient } from "@tanstack/react-query";

import type { Series } from "@/arr-client/types";
import { queryKeys } from "@/lib/query-keys";

import type { OpExecutor, OpExecutorContext } from "../dispatcher";
import type { ArrOutboxItem } from "../types";
import { asQueryClient } from "./as-query-client";

type UpdateSeriesMonitoredPayload = {
  readonly seriesId: number;
  readonly monitored: boolean;
};

export type UpdateSeriesMonitoredClient = {
  readonly updateSeries: (
    id: number,
    changes: { readonly monitored: boolean },
  ) => Promise<unknown>;
};

const isPayload = (value: unknown): value is UpdateSeriesMonitoredPayload => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.seriesId === "number" && typeof record.monitored === "boolean"
  );
};

const requirePayload = (item: ArrOutboxItem): UpdateSeriesMonitoredPayload => {
  if (!isPayload(item.payload)) {
    throw new Error("Invalid updateSeriesMonitored outbox payload");
  }
  return item.payload;
};

const patchSeriesMonitored = (
  queryClient: QueryClient,
  seriesId: number,
  monitored: boolean,
): void => {
  queryClient.setQueryData<Series[]>(queryKeys.series.all, (current) => {
    if (current === undefined) {
      return current;
    }
    return current.map((series) =>
      series.id === seriesId ? { ...series, monitored } : series,
    );
  });
  queryClient.setQueryData<Series>(
    queryKeys.series.detail(seriesId),
    (current) => {
      if (current === undefined) {
        return current;
      }
      return { ...current, monitored };
    },
  );
};

/**
 * Outbox executor for series monitored toggles.
 */
export const createUpdateSeriesMonitoredExecutor = (
  client: UpdateSeriesMonitoredClient,
): OpExecutor => ({
  applyOptimistic: (item: ArrOutboxItem, qc: unknown): void => {
    const payload = requirePayload(item);
    const queryClient = asQueryClient(qc);
    if (queryClient === undefined) {
      return;
    }
    patchSeriesMonitored(queryClient, payload.seriesId, payload.monitored);
  },
  rollbackOptimistic: (item: ArrOutboxItem, qc: unknown): void => {
    const payload = requirePayload(item);
    const queryClient = asQueryClient(qc);
    if (queryClient === undefined) {
      return;
    }
    patchSeriesMonitored(queryClient, payload.seriesId, !payload.monitored);
  },
  execute: async (
    item: ArrOutboxItem,
    ctx: OpExecutorContext,
  ): Promise<void> => {
    const payload = requirePayload(item);
    await client.updateSeries(payload.seriesId, {
      monitored: payload.monitored,
    });
    const queryClient = asQueryClient(ctx.queryClient);
    if (queryClient === undefined) {
      return;
    }
    await queryClient.invalidateQueries({ queryKey: queryKeys.series.all });
    await queryClient.invalidateQueries({
      queryKey: queryKeys.series.detail(payload.seriesId),
    });
  },
});
