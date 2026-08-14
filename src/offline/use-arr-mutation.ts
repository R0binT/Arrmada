import { useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

import { useArrClients } from "@/hooks/use-arr-clients";
import { t } from "@/i18n";

import type { ArrServiceName } from "./connectivity/types";
import type { OutboxDispatcher } from "./outbox/dispatcher";
import { ensureOutboxDispatcher } from "./outbox/singleton";
import { shouldEnqueueArrWrite } from "./should-enqueue-arr-write";
import { useOfflineStatus } from "./use-offline-status";

export {
  isDeviceOffline,
  shouldEnqueueArrWrite,
} from "./should-enqueue-arr-write";

export type QueuedArrWriteResult = {
  readonly queued: true;
  readonly id: string;
};

/**
 * True when an add mutation resolved by enqueueing an outbox item.
 */
export const isQueuedArrWrite = (
  value: unknown,
): value is QueuedArrWriteResult => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as { readonly queued?: unknown; readonly id?: unknown };
  return record.queued === true && typeof record.id === "string";
};

/**
 * Throws when Arr add defaults were never loaded (empty folder / invalid profile).
 */
export const assertArrAddDefaults = (input: {
  readonly qualityProfileId: number;
  readonly rootFolderPath: string;
}): void => {
  if (
    !Number.isFinite(input.qualityProfileId) ||
    input.rootFolderPath.trim() === ""
  ) {
    throw new Error(t("offline.missingDefaults"));
  }
};

/**
 * True when Arr writes for `service` should go to the outbox.
 */
export const useShouldEnqueueArrWrite = (service: ArrServiceName): boolean => {
  const status = useOfflineStatus();
  return shouldEnqueueArrWrite(status, service);
};

/**
 * App outbox dispatcher wired with current Arr clients + QueryClient.
 */
export const useOutboxDispatcher = (): OutboxDispatcher => {
  const queryClient = useQueryClient();
  const { radarr, sonarr } = useArrClients();
  return useMemo(
    () =>
      ensureOutboxDispatcher({
        queryClient,
        radarr,
        sonarr,
      }),
    [queryClient, radarr, sonarr],
  );
};
