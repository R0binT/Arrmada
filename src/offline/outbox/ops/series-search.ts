import type { OpExecutor } from "../dispatcher";
import type { ArrOutboxItem } from "../types";

type SeriesSearchPayload = {
  readonly seriesId: number;
};

export type SeriesSearchClient = {
  readonly command: (
    name: string,
    body?: Record<string, unknown>,
  ) => Promise<unknown>;
};

const isPayload = (value: unknown): value is SeriesSearchPayload => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return typeof record.seriesId === "number";
};

const requirePayload = (item: ArrOutboxItem): SeriesSearchPayload => {
  if (!isPayload(item.payload)) {
    throw new Error("Invalid seriesSearch outbox payload");
  }
  return item.payload;
};

/**
 * Outbox executor for Sonarr SeriesSearch.
 */
export const createSeriesSearchExecutor = (
  client: SeriesSearchClient,
): OpExecutor => ({
  execute: async (item: ArrOutboxItem): Promise<void> => {
    const payload = requirePayload(item);
    await client.command("SeriesSearch", { seriesId: payload.seriesId });
  },
});
