import type { QueryClient } from "@tanstack/react-query";

import { getOfflineStatus } from "../connectivity/offline-status-store";
import {
  createOutboxDispatcher,
  type OutboxDispatcher,
} from "./dispatcher";
import {
  configureOpRegistry,
  getOpExecutor,
  type OpRegistryDeps,
} from "./ops/registry";

export type EnsureOutboxDispatcherInput = OpRegistryDeps & {
  readonly queryClient: QueryClient;
};

let dispatcher: OutboxDispatcher | undefined;
let boundQueryClient: QueryClient | undefined;

const createOutboxId = (): string => {
  const random = Math.random().toString(36).slice(2, 10);
  return `outbox-${Date.now().toString(36)}-${random}`;
};

/**
 * App-level outbox dispatcher: configures Arr op clients and binds QueryClient
 * into optimistic apply / execute / rollback paths.
 */
export const ensureOutboxDispatcher = (
  input: EnsureOutboxDispatcherInput,
): OutboxDispatcher => {
  configureOpRegistry({
    radarr: input.radarr,
    sonarr: input.sonarr,
  });
  boundQueryClient = input.queryClient;
  if (dispatcher !== undefined) {
    return dispatcher;
  }
  dispatcher = createOutboxDispatcher({
    now: () => new Date(),
    createId: createOutboxId,
    getExecutor: getOpExecutor,
    getQueryClient: () => boundQueryClient,
    isServiceOnline: (service) => getOfflineStatus()[service] === "online",
    executeOnline: async (item) => {
      await getOpExecutor(item.type).execute(item, {
        queryClient: boundQueryClient,
      });
    },
  });
  return dispatcher;
};

/** Resets the singleton (tests only). */
export const resetOutboxDispatcherForTests = (): void => {
  dispatcher = undefined;
  boundQueryClient = undefined;
};
