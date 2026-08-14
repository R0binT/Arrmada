import type { OpExecutor } from "../dispatcher";
import type { ArrOutboxItem } from "../types";

type SeasonSearchPayload = {
  readonly seriesId: number;
  readonly seasonNumber: number;
};

export type SeasonSearchClient = {
  readonly command: (
    name: string,
    body?: Record<string, unknown>,
  ) => Promise<unknown>;
};

const isPayload = (value: unknown): value is SeasonSearchPayload => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.seriesId === "number" &&
    typeof record.seasonNumber === "number"
  );
};

const requirePayload = (item: ArrOutboxItem): SeasonSearchPayload => {
  if (!isPayload(item.payload)) {
    throw new Error("Invalid seasonSearch outbox payload");
  }
  return item.payload;
};

/**
 * Outbox executor for Sonarr SeasonSearch.
 */
export const createSeasonSearchExecutor = (
  client: SeasonSearchClient,
): OpExecutor => ({
  execute: async (item: ArrOutboxItem): Promise<void> => {
    const payload = requirePayload(item);
    await client.command("SeasonSearch", {
      seriesId: payload.seriesId,
      seasonNumber: payload.seasonNumber,
    });
  },
});
