import type { OpExecutor } from "../dispatcher";
import type { ArrOutboxItem } from "../types";

type GrabSeriesReleasePayload = {
  readonly guid: string;
  readonly indexerId: number;
};

export type GrabSeriesReleaseClient = {
  readonly grabRelease: (input: {
    readonly guid: string;
    readonly indexerId: number;
  }) => Promise<unknown>;
};

const isPayload = (value: unknown): value is GrabSeriesReleasePayload => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.guid === "string" && typeof record.indexerId === "number"
  );
};

const requirePayload = (item: ArrOutboxItem): GrabSeriesReleasePayload => {
  if (!isPayload(item.payload)) {
    throw new Error("Invalid grabSeriesRelease outbox payload");
  }
  return item.payload;
};

/**
 * Outbox executor for grabbing a series release.
 */
export const createGrabSeriesReleaseExecutor = (
  client: GrabSeriesReleaseClient,
): OpExecutor => ({
  execute: async (item: ArrOutboxItem): Promise<void> => {
    const payload = requirePayload(item);
    await client.grabRelease({
      guid: payload.guid,
      indexerId: payload.indexerId,
    });
  },
});
