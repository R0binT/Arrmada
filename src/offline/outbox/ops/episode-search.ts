import type { OpExecutor } from "../dispatcher";
import type { ArrOutboxItem } from "../types";

type EpisodeSearchPayload = {
  readonly episodeId: number;
};

export type EpisodeSearchClient = {
  readonly command: (
    name: string,
    body?: Record<string, unknown>,
  ) => Promise<unknown>;
};

const isPayload = (value: unknown): value is EpisodeSearchPayload => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return typeof record.episodeId === "number";
};

const requirePayload = (item: ArrOutboxItem): EpisodeSearchPayload => {
  if (!isPayload(item.payload)) {
    throw new Error("Invalid episodeSearch outbox payload");
  }
  return item.payload;
};

/**
 * Outbox executor for Sonarr EpisodeSearch.
 */
export const createEpisodeSearchExecutor = (
  client: EpisodeSearchClient,
): OpExecutor => ({
  execute: async (item: ArrOutboxItem): Promise<void> => {
    const payload = requirePayload(item);
    await client.command("EpisodeSearch", { episodeIds: [payload.episodeId] });
  },
});
