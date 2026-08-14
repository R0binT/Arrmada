import type { OpExecutor } from "../dispatcher";
import type { ArrOutboxItem } from "../types";

type GrabMovieReleasePayload = {
  readonly guid: string;
  readonly indexerId: number;
};

export type GrabMovieReleaseClient = {
  readonly grabRelease: (input: {
    readonly guid: string;
    readonly indexerId: number;
  }) => Promise<unknown>;
};

const isPayload = (value: unknown): value is GrabMovieReleasePayload => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.guid === "string" && typeof record.indexerId === "number"
  );
};

const requirePayload = (item: ArrOutboxItem): GrabMovieReleasePayload => {
  if (!isPayload(item.payload)) {
    throw new Error("Invalid grabMovieRelease outbox payload");
  }
  return item.payload;
};

/**
 * Outbox executor for grabbing a movie release.
 */
export const createGrabMovieReleaseExecutor = (
  client: GrabMovieReleaseClient,
): OpExecutor => ({
  execute: async (item: ArrOutboxItem): Promise<void> => {
    const payload = requirePayload(item);
    await client.grabRelease({
      guid: payload.guid,
      indexerId: payload.indexerId,
    });
  },
});
