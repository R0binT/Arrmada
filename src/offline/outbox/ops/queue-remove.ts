import type { OpExecutor } from "../dispatcher";
import type { ArrOutboxItem } from "../types";

type QueueRemovePayload = {
  readonly id: number;
  readonly removeFromClient: boolean;
  readonly blocklist: boolean;
};

export type QueueRemoveClient = {
  readonly removeQueueItem: (
    id: number,
    options: { removeFromClient: boolean; blocklist: boolean },
  ) => Promise<unknown>;
};

export type QueueRemoveClients = {
  readonly radarr?: QueueRemoveClient;
  readonly sonarr?: QueueRemoveClient;
};

const isPayload = (value: unknown): value is QueueRemovePayload => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "number" &&
    typeof record.removeFromClient === "boolean" &&
    typeof record.blocklist === "boolean"
  );
};

const requirePayload = (item: ArrOutboxItem): QueueRemovePayload => {
  if (!isPayload(item.payload)) {
    throw new Error("Invalid queueRemove outbox payload");
  }
  return item.payload;
};

const requireClient = (
  item: ArrOutboxItem,
  clients: QueueRemoveClients,
): QueueRemoveClient => {
  const client = item.service === "radarr" ? clients.radarr : clients.sonarr;
  if (client === undefined) {
    throw new Error(
      item.service === "radarr"
        ? "Radarr is not configured."
        : "Sonarr is not configured.",
    );
  }
  return client;
};

/**
 * Outbox executor for queue item removal on Radarr or Sonarr.
 */
export const createQueueRemoveExecutor = (
  clients: QueueRemoveClients,
): OpExecutor => ({
  execute: async (item: ArrOutboxItem): Promise<void> => {
    const payload = requirePayload(item);
    const client = requireClient(item, clients);
    await client.removeQueueItem(payload.id, {
      removeFromClient: payload.removeFromClient,
      blocklist: payload.blocklist,
    });
  },
});
