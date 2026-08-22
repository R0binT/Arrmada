import type { OpExecutor } from "../dispatcher";
import type { ArrOutboxItem } from "../types";

type MovieSearchPayload = {
  readonly movieId: number;
};

export type MovieSearchClient = {
  readonly command: (
    name: string,
    body?: Record<string, unknown>,
  ) => Promise<unknown>;
};

const isPayload = (value: unknown): value is MovieSearchPayload => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return typeof record.movieId === "number";
};

const requirePayload = (item: ArrOutboxItem): MovieSearchPayload => {
  if (!isPayload(item.payload)) {
    throw new Error("Invalid movieSearch outbox payload");
  }
  return item.payload;
};

/**
 * Outbox executor for Radarr MoviesSearch.
 */
export const createMovieSearchExecutor = (
  client: MovieSearchClient,
): OpExecutor => ({
  execute: async (item: ArrOutboxItem): Promise<void> => {
    const payload = requirePayload(item);
    await client.command("MoviesSearch", { movieIds: [payload.movieId] });
  },
});
