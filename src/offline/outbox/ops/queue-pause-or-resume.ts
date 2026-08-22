import type { OpExecutor } from "../dispatcher";
import type { ArrOutboxItem } from "../types";

type QueuePauseOrResumePayload = {
  readonly downloadId: string;
  readonly isPaused: boolean;
};

export type QueuePauseOrResumeClient = {
  readonly command: (
    name: string,
    body?: Record<string, unknown>,
  ) => Promise<unknown>;
};

export type QueuePauseOrResumeClients = {
  readonly radarr?: QueuePauseOrResumeClient;
  readonly sonarr?: QueuePauseOrResumeClient;
};

const isPayload = (value: unknown): value is QueuePauseOrResumePayload => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.downloadId === "string" &&
    record.downloadId.length > 0 &&
    typeof record.isPaused === "boolean"
  );
};

const requirePayload = (item: ArrOutboxItem): QueuePauseOrResumePayload => {
  if (!isPayload(item.payload)) {
    throw new Error("Invalid queuePauseOrResume outbox payload");
  }
  return item.payload;
};

const requireClient = (
  item: ArrOutboxItem,
  clients: QueuePauseOrResumeClients,
): QueuePauseOrResumeClient => {
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
 * Outbox executor for DownloadClientPause / DownloadClientResume.
 */
export const createQueuePauseOrResumeExecutor = (
  clients: QueuePauseOrResumeClients,
): OpExecutor => ({
  execute: async (item: ArrOutboxItem): Promise<void> => {
    const payload = requirePayload(item);
    const client = requireClient(item, clients);
    const commandName = payload.isPaused
      ? "DownloadClientResume"
      : "DownloadClientPause";
    await client.command(commandName, { downloadId: payload.downloadId });
  },
});
